import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { CareerGraph } from "@/lib/types";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import { runAlignment } from "@/lib/matching";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AlignRequest {
  careerGraph: CareerGraph;
  jobDescription: string;
}

interface JdRequirementsResponse {
  requirements: string[];
}

interface TailoredBulletsResponse {
  tailoredBullets: string[];
}

// ─── Embedding with model fallback ──────────────────────────────────────────

// gemini-embedding-001: supports individual embeddings per input (batch-capable) — try first.
// gemini-embedding-2: produces ONE aggregated embedding for multiple inputs; used per-item as fallback.
const BATCH_MODEL = "gemini-embedding-001";
const SINGLE_MODEL = "gemini-embedding-2";

/**
 * Generate one embedding per text. Uses gemini-embedding-001 in batch mode first.
 * Falls back to gemini-embedding-2 called once-per-text if batch fails.
 */
async function generateEmbeddings(
  client: GoogleGenAI,
  texts: string[]
): Promise<number[][]> {
  // Attempt 1: batch with gemini-embedding-001
  try {
    const result = await client.models.embedContent({
      model: BATCH_MODEL,
      contents: texts,
    });
    const embeddings = result.embeddings?.map((e) => e.values ?? []) ?? [];
    if (embeddings.length === texts.length && embeddings[0].length > 0) {
      console.log(`[align] Embeddings via ${BATCH_MODEL} (batch, ${texts.length} items)`);
      return embeddings;
    }
  } catch (err) {
    console.warn(`[align] ${BATCH_MODEL} batch failed:`, err instanceof Error ? err.message : err);
  }

  // Attempt 2: gemini-embedding-2 called individually per text
  console.log(`[align] Falling back to ${SINGLE_MODEL} per-item...`);
  const embeddings: number[][] = [];
  for (const text of texts) {
    const result = await client.models.embedContent({
      model: SINGLE_MODEL,
      contents: text,
    });
    const values = result.embeddings?.[0]?.values ?? [];
    if (values.length === 0) throw new Error(`${SINGLE_MODEL} returned empty embedding for: ${text.slice(0, 40)}`);
    embeddings.push(values);
  }
  console.log(`[align] Embeddings via ${SINGLE_MODEL} (per-item, ${texts.length} items)`);
  return embeddings;
}

/**
 * Format a JS number[] as a pgvector literal string: "[0.1, 0.2, ...]"
 * Supabase RPC parameters of type vector[] must be text[], each element a vector string.
 */
function toVectorString(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

// ─── Gemini client ──────────────────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as AlignRequest;
    if (!body.careerGraph || !body.jobDescription) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { careerGraph, jobDescription } = body;
    const client = getGeminiClient();

    // ========================================================================
    // PHASE 1: VECTOR ENGINE (The Brain)
    // ========================================================================

    // 1a. Extract JD Requirements via Gemini structured output
    const reqExtractionPrompt = `Extract a concise list of the core technical and soft skill requirements from this Job Description. Return ONLY a JSON object with a "requirements" key containing an array of strings (each string is one skill/requirement).\n\nJob Description:\n${jobDescription}`;

    const reqRes = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: reqExtractionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["requirements"],
        },
        temperature: 0.1,
      },
    });
    const jdRequirements = (JSON.parse(reqRes.text!) as JdRequirementsResponse).requirements;

    // 1b. Embed JD Requirements & Profile Skills in parallel
    const profileSkills = careerGraph.skills.map((s) => s.name);

    let matchedSkills: Array<{ req: string; similarity: number }> = [];
    let partialSkills: Array<{ req: string; similarity: number }> = [];
    let missingSkills: Array<{ req: string; similarity: number }> = [];
    let usedVectorEngine = false;

    if (jdRequirements.length > 0 && profileSkills.length > 0 && isSupabaseConfigured()) {
      try {
        // Generate real embeddings for both sides in parallel
        const [jdEmbeddings, skillEmbeddings] = await Promise.all([
          generateEmbeddings(client, jdRequirements),
          generateEmbeddings(client, profileSkills),
        ]);

        // 1c. Calculate Cosine Similarity via Supabase pgvector — no JS math needed!
        // pgvector expects vector[] params as text[] where each element is "[n1,n2,...]"
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.rpc("get_max_similarities", {
          target_embeddings: jdEmbeddings.map(toVectorString),
          skill_embeddings: skillEmbeddings.map(toVectorString),
        });

        if (error) {
          console.error("[Vector Engine] Supabase RPC failed:", error.message);
          throw error;
        }

        const similarities = data as number[];
        usedVectorEngine = true;

        // 1d. Objective skill buckets based on real cosine similarity thresholds
        for (let i = 0; i < jdRequirements.length; i++) {
          const req = jdRequirements[i];
          const sim = Math.max(0, Math.min(1, similarities[i] || 0));

          if (sim >= 0.75) {
            matchedSkills.push({ req, similarity: sim });
          } else if (sim >= 0.60) {
            partialSkills.push({ req, similarity: sim });
          } else {
            missingSkills.push({ req, similarity: sim });
          }
        }
      } catch (vectorErr) {
        console.warn(
          "[Vector Engine] Failed, falling back to local matching:",
          vectorErr instanceof Error ? vectorErr.message : vectorErr
        );
        // Fall through to local fallback below
      }
    }

    // Local fallback if vector engine failed or isn't available
    if (!usedVectorEngine) {
      missingSkills = jdRequirements.map((req) => ({ req, similarity: 0 }));
    }

    // 1e. Mathematical alignment score
    const totalReqs = jdRequirements.length || 1;
    const mathScore = Math.round(
      ((matchedSkills.length + partialSkills.length * 0.5) / totalReqs) * 100
    );

    // ========================================================================
    // PHASE 2: GEN AI ENGINE (The Writer)
    // ========================================================================

    const writerPrompt = `You are an expert ATS resume optimizer.
The Vector Engine has mathematically determined the following insights by computing cosine similarity between the Job Description requirements and the candidate's skills:

- MATCHED Requirements (cosine similarity ≥ 0.75): ${matchedSkills.map((s) => s.req).join(", ") || "None"}
- PARTIAL Requirements (cosine similarity 0.60–0.74): ${partialSkills.map((s) => s.req).join(", ") || "None"}
- MISSING Requirements (cosine similarity < 0.60 — GAPS): ${missingSkills.map((s) => s.req).join(", ") || "None"}

Candidate Experience Data:
${JSON.stringify(careerGraph.experiences, null, 2)}

Your Task:
Act as the "Writer" engine. Use ONLY the mathematically proven insights above to rewrite the candidate's resume bullets.
- Highlight and expand on the MATCHED skills
- Bridge the gap for PARTIAL matches by framing existing experience differently
- Suggest how MISSING skills could be positioned if relevant adjacent experience exists

Provide 6-10 ATS-optimized resume bullet points. Each must start with a strong action verb and include specific metrics where available.`;

    const writerRes = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: writerPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tailoredBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["tailoredBullets"],
        },
        temperature: 0.3,
      },
    });

    const tailoredBullets = (JSON.parse(writerRes.text!) as TailoredBulletsResponse).tailoredBullets;

    // ========================================================================
    // Build the final AlignmentResult — merge Vector Engine data into resume
    // ========================================================================

    const baseResult = runAlignment(careerGraph, jobDescription);
    baseResult.score = usedVectorEngine ? mathScore : baseResult.score;
    baseResult.jobSkills = jdRequirements;
    baseResult.pipeline = usedVectorEngine ? "vector-engine" : "fallback";

    // Only override skill analysis when the Vector Engine succeeded.
    // When it failed, keep the local matching results from runAlignment().
    if (usedVectorEngine) {
      baseResult.matched = matchedSkills.map(({ req, similarity }) => ({
        skill: req,
        status: "match" as const,
        similarity: parseFloat(similarity.toFixed(3)),
      }));
      baseResult.partial = partialSkills.map(({ req, similarity }) => ({
        skill: req,
        status: "partial" as const,
        similarity: parseFloat(similarity.toFixed(3)),
      }));
      baseResult.gaps = missingSkills.map(({ req, similarity }) => ({
        skill: req,
        status: "gap" as const,
        similarity: parseFloat(similarity.toFixed(3)),
      }));
    }

    // Inject GenAI-written bullets into the most recent experience
    if (baseResult.resume.experiences.length > 0 && tailoredBullets.length > 0) {
      baseResult.resume.experiences[0].bullets = tailoredBullets.map((text: string) => ({
        text,
        emphasized: true,
      }));
    }

    return NextResponse.json(baseResult);
  } catch (err) {
    console.error("[align] Pipeline failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

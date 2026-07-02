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

// Try models in order — availability depends on API key tier.
const EMBEDDING_MODELS = [
  "gemini-embedding-2",
  "gemini-embedding-001",
];

async function generateEmbeddings(
  client: GoogleGenAI,
  texts: string[]
): Promise<number[][]> {
  let lastError: unknown;
  for (const model of EMBEDDING_MODELS) {
    try {
      const result = await client.models.embedContent({
        model,
        contents: texts,
      });
      const embeddings = result.embeddings?.map((e) => e.values ?? []) ?? [];
      if (embeddings.length === texts.length && embeddings[0].length > 0) {
        return embeddings;
      }
    } catch (err) {
      console.warn(
        `[align] Embedding model ${model} failed:`,
        err instanceof Error ? err.message : err
      );
      lastError = err;
    }
  }
  throw lastError ?? new Error("All embedding models failed.");
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
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.rpc("get_max_similarities", {
          target_embeddings: jdEmbeddings,
          skill_embeddings: skillEmbeddings,
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

    // Pass real cosine similarity values — NOT hardcoded placeholders
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

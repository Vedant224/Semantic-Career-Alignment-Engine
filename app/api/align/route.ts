import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { CareerGraph } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AlignRequest {
  careerGraph: CareerGraph;
  jobDescription: string;
}

interface SkillAnalysis {
  matched: string[];
  partial: string[];
  missing: string[];
}

interface AlignResponse {
  alignmentScore: number;
  skillAnalysis: SkillAnalysis;
  tailoredBullets: string[];
}

// ─── Math utilities ─────────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two vectors.
 * Returns a value in [-1, 1]; 1 means identical direction.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * Very lightweight text → numeric vector for deterministic local scoring.
 * NOT a real embedding — just a bag-of-characters frequency vector.
 * Used only as a fallback when the Gemini API is unavailable.
 */
function naiveTextVector(text: string): number[] {
  const lower = text.toLowerCase().replace(/[^a-z0-9 ]/g, "");
  // 36 buckets: a-z + 0-9
  const vec = new Array(36).fill(0);
  for (const ch of lower) {
    if (ch === " ") continue;
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) vec[code - 97]++;
    else if (code >= 48 && code <= 57) vec[26 + code - 48]++;
  }
  // L2 normalize
  const norm = Math.sqrt(vec.reduce((s: number, v: number) => s + v * v, 0));
  if (norm > 0) for (let i = 0; i < vec.length; i++) vec[i] /= norm;
  return vec;
}

// ─── Gemini client ──────────────────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file."
    );
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate an embedding using Gemini text-embedding-004.
 */
async function generateEmbedding(
  client: GoogleGenAI,
  text: string
): Promise<number[]> {
  const result = await client.models.embedContent({
    model: "text-embedding-004",
    contents: text,
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini returned empty embedding.");
  }
  return values;
}

// ─── Structured Output Schema ───────────────────────────────────────────────

const ALIGN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    alignmentScore: {
      type: Type.NUMBER,
      description:
        "Overall alignment percentage (0-100) of the candidate to the job.",
    },
    skillAnalysis: {
      type: Type.OBJECT,
      properties: {
        matched: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Skills the candidate fully matches from the JD requirements.",
        },
        partial: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Skills the candidate partially matches (related experience but not exact).",
        },
        missing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            "Skills required by the JD that the candidate lacks entirely.",
        },
      },
      required: ["matched", "partial", "missing"],
    },
    tailoredBullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "ATS-optimized resume bullet points tailored to the target JD. Each bullet should start with a strong action verb and include metrics where possible.",
    },
  },
  required: ["alignmentScore", "skillAnalysis", "tailoredBullets"],
};

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Parse & validate request ───────────────────────────────────────
    const body = (await request.json()) as AlignRequest;

    if (!body.careerGraph || !body.jobDescription) {
      return NextResponse.json(
        { error: "Both 'careerGraph' and 'jobDescription' are required." },
        { status: 400 }
      );
    }

    const { careerGraph, jobDescription } = body;

    if (jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "Job description is too short. Provide at least 20 characters." },
        { status: 400 }
      );
    }

    // ── 2. Generate JD embedding ──────────────────────────────────────────
    let jdEmbedding: number[] | null = null;
    let geminiAvailable = true;
    let client: GoogleGenAI | null = null;

    try {
      client = getGeminiClient();
      jdEmbedding = await generateEmbedding(client, jobDescription);
    } catch (err) {
      console.warn(
        "[align] Gemini embedding unavailable, falling back to local scoring:",
        err instanceof Error ? err.message : err
      );
      geminiAvailable = false;
    }

    // ── 3. (Optional) Supabase similarity lookup ──────────────────────────
    // If the user's data is stored in Supabase and we have a real embedding,
    // we could query `match_career_profiles` here. This is left as a
    // conceptual placeholder — the caller can pass the career graph directly.
    //
    // Example (uncomment when ready):
    // if (jdEmbedding && isSupabaseConfigured()) {
    //   const supabase = getSupabaseClient();
    //   const { data } = await supabase.rpc('match_career_profiles', {
    //     query_embedding: jdEmbedding,
    //     match_threshold: 0.5,
    //     match_count: 3,
    //   });
    //   // data contains the closest historical profiles
    // }

    // ── 4. Deterministic alignment score (local fallback) ─────────────────
    let deterministicScore = 0;

    if (jdEmbedding) {
      // Build a text representation of the career graph for embedding
      const graphText = [
        careerGraph.headline,
        ...careerGraph.skills.map((s) => s.name),
        ...careerGraph.experiences.map(
          (e) => `${e.role} at ${e.company}: ${e.description}`
        ),
        ...careerGraph.projects.map((p) => `${p.name}: ${p.description}`),
      ].join(". ");

      try {
        const graphEmbedding = await generateEmbedding(client!, graphText);
        deterministicScore = Math.round(
          cosineSimilarity(jdEmbedding, graphEmbedding) * 100
        );
      } catch {
        // Fall through to naive scoring
        const jdVec = naiveTextVector(jobDescription);
        const graphVec = naiveTextVector(graphText);
        deterministicScore = Math.round(
          cosineSimilarity(jdVec, graphVec) * 100
        );
      }
    } else {
      // Fully local: use naive text vectors
      const graphText = [
        careerGraph.headline,
        ...careerGraph.skills.map((s) => s.name),
        ...careerGraph.experiences.map((e) => e.description),
      ].join(". ");

      const jdVec = naiveTextVector(jobDescription);
      const graphVec = naiveTextVector(graphText);
      deterministicScore = Math.round(
        cosineSimilarity(jdVec, graphVec) * 100
      );
    }

    // ── 5. LLM-generated structured output ────────────────────────────────
    if (geminiAvailable && client) {
      const prompt = `You are an expert ATS resume optimizer and career alignment analyst.

## Job Description
${jobDescription}

## Candidate Career Graph (JSON)
${JSON.stringify(careerGraph, null, 2)}

## Your Task
Analyze the candidate's career graph against the job description and produce:

1. **alignmentScore**: An honest percentage (0-100) reflecting how well the candidate matches the JD requirements. Consider skills, experience level, and domain relevance.

2. **skillAnalysis**: Categorize the JD requirements into:
   - **matched**: Skills/technologies the candidate clearly possesses (direct match in skills or demonstrated in experience/projects).
   - **partial**: Skills the candidate has related but not exact experience with.
   - **missing**: Skills required by the JD that the candidate lacks.

3. **tailoredBullets**: 6-10 ATS-optimized resume bullet points that:
   - Start with strong action verbs (Led, Engineered, Architected, Implemented, etc.)
   - Incorporate metrics and quantified impact from the career graph
   - Mirror keywords and phrases from the JD for maximum ATS compatibility
   - Prioritize experiences and projects most relevant to this specific role

Be accurate and grounded in the data provided. Do not fabricate skills or metrics.`;

      try {
        const result = await client.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: ALIGN_RESPONSE_SCHEMA,
            temperature: 0.3,
          },
        });

        const text = result.text;
        if (!text) {
          throw new Error("Gemini returned empty response.");
        }

        const structured = JSON.parse(text) as AlignResponse;

        return NextResponse.json({
          alignmentScore: structured.alignmentScore,
          deterministicScore,
          skillAnalysis: structured.skillAnalysis,
          tailoredBullets: structured.tailoredBullets,
          source: "gemini",
        });
      } catch (llmErr) {
        console.error(
          "[align] LLM generation failed, returning deterministic result:",
          llmErr instanceof Error ? llmErr.message : llmErr
        );
        // Fall through to deterministic-only response
      }
    }

    // ── 6. Fallback: deterministic-only response ──────────────────────────
    // If Gemini is not available or failed, return what we can compute locally.
    const skillNames = careerGraph.skills.map((s) => s.name.toLowerCase());
    const jdLower = jobDescription.toLowerCase();

    const matched = careerGraph.skills
      .filter((s) => jdLower.includes(s.name.toLowerCase()))
      .map((s) => s.name);

    const allJdTerms = jobDescription
      .split(/[\s,;.()]+/)
      .filter((t) => t.length > 2)
      .map((t) => t.toLowerCase());

    const missing = allJdTerms
      .filter(
        (term) =>
          !skillNames.some(
            (sn) => sn.includes(term) || term.includes(sn)
          )
      )
      .filter(
        (term) =>
          // Only keep terms that look like technical skills
          /^[a-z][a-z0-9+#.]*$/i.test(term) && term.length > 3
      )
      .slice(0, 10);

    return NextResponse.json({
      alignmentScore: deterministicScore,
      deterministicScore,
      skillAnalysis: {
        matched,
        partial: [] as string[],
        missing: [...new Set(missing)],
      },
      tailoredBullets: careerGraph.experiences.flatMap((exp) =>
        exp.description
          .split(/(?<=[.!?])\s+/)
          .filter(Boolean)
          .slice(0, 2)
      ),
      source: "deterministic",
    });
  } catch (err) {
    console.error("[align] Unhandled error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

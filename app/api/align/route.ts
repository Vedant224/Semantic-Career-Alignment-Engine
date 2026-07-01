import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import type { CareerGraph, AlignmentResult, SkillAlignment } from "@/lib/types";
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

// ─── Gemini Utilities ───────────────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

async function generateEmbeddings(
  client: GoogleGenAI,
  texts: string[]
): Promise<number[][]> {
  const result = await client.models.embedContent({
    model: "text-embedding-004",
    contents: texts,
  });

  const embeddings = result.embeddings?.map((e) => e.values) || [];
  if (embeddings.length === 0 || embeddings.length !== texts.length) {
    throw new Error("Failed to generate embeddings for all inputs.");
  }
  return embeddings;
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
    
    // 1a. Extract JD Requirements
    const reqExtractionPrompt = `Extract a list of the core technical and soft skill requirements from this Job Description. Return ONLY a JSON array of strings under the "requirements" key.\n\nJob Description:\n${jobDescription}`;
    const reqRes = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: reqExtractionPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { requirements: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["requirements"]
        },
        temperature: 0.1,
      },
    });
    const jdRequirements = (JSON.parse(reqRes.text!) as JdRequirementsResponse).requirements;

    // 1b. Embed JD Requirements & Profile Skills
    const profileSkills = careerGraph.skills.map((s) => s.name);
    
    let similarities: number[] = [];
    let matchedSkills: string[] = [];
    let partialSkills: string[] = [];
    let missingSkills: string[] = [];

    // Only run vector math if we have skills to compare and Supabase is configured
    if (jdRequirements.length > 0 && profileSkills.length > 0 && isSupabaseConfigured()) {
      const [jdEmbeddings, skillEmbeddings] = await Promise.all([
        generateEmbeddings(client, jdRequirements),
        generateEmbeddings(client, profileSkills)
      ]);

      // 1c. Calculate Cosine Similarity mathematically using Supabase pgvector
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc("get_max_similarities", {
        target_embeddings: jdEmbeddings,
        skill_embeddings: skillEmbeddings,
      });

      if (error) {
        console.error("[Vector Engine] Supabase RPC failed:", error);
        throw error;
      }
      similarities = data as number[];

      // 1d. Objective Skill Analysis based on Math
      for (let i = 0; i < jdRequirements.length; i++) {
        const req = jdRequirements[i];
        const sim = similarities[i] || 0;
        
        if (sim >= 0.75) {
          matchedSkills.push(req);
        } else if (sim >= 0.60) {
          partialSkills.push(req);
        } else {
          missingSkills.push(req);
        }
      }
    } else {
      // Fallback if no skills or DB not configured
      missingSkills = jdRequirements;
    }

    // 1e. Objective Mathematical Alignment Score
    const totalReqs = jdRequirements.length || 1;
    const mathScore = Math.round(((matchedSkills.length + partialSkills.length * 0.5) / totalReqs) * 100);


    // ========================================================================
    // PHASE 2: GEN AI ENGINE (The Writer)
    // ========================================================================
    
    const writerPrompt = `You are an expert ATS resume optimizer.
Here are the mathematically proven targeted insights for this candidate against the Job Description:
- MATCHED Requirements: ${matchedSkills.join(", ") || "None"}
- PARTIAL Requirements: ${partialSkills.join(", ") || "None"}
- MISSING Requirements (Gaps): ${missingSkills.join(", ") || "None"}

Candidate Career Graph:
${JSON.stringify(careerGraph.experiences, null, 2)}

Your Task:
Act as the "Writer" to rewrite the candidate's resume bullets. Focus entirely on bridging the gaps and highlighting the matches.
Provide 6-10 ATS-optimized resume bullet points that incorporate metrics, action verbs, and these targeted insights.`;

    const writerRes = await client.models.generateContent({
      model: "gemini-flash-latest",
      contents: writerPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { tailoredBullets: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["tailoredBullets"]
        },
        temperature: 0.3,
      },
    });

    const tailoredBullets = (JSON.parse(writerRes.text!) as TailoredBulletsResponse).tailoredBullets;

    // ========================================================================
    // Build the final AlignmentResult response
    // ========================================================================
    
    const baseResult = runAlignment(careerGraph, jobDescription);
    baseResult.score = mathScore;
    baseResult.jobSkills = jdRequirements;
    baseResult.matched = matchedSkills.map((s) => ({ skill: s, status: "match", similarity: 1 }));
    baseResult.partial = partialSkills.map((s) => ({ skill: s, status: "partial", similarity: 0.5 }));
    baseResult.gaps = missingSkills.map((s) => ({ skill: s, status: "gap", similarity: 0 }));

    if (baseResult.resume.experiences.length > 0 && tailoredBullets.length > 0) {
      baseResult.resume.experiences[0].bullets = tailoredBullets.map((text: string) => ({
        text,
        emphasized: true
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


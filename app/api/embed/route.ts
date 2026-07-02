import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Models to try in order — the SDK uses v1beta; availability depends on API key tier.
const EMBEDDING_MODELS = [
  "gemini-embedding-exp-03-07",
  "text-embedding-005",
  "text-embedding-004",
  "embedding-001",
];

async function generateEmbeddingsWithFallback(
  client: GoogleGenAI,
  inputs: string[]
): Promise<number[][]> {
  let lastError: unknown;
  for (const model of EMBEDDING_MODELS) {
    try {
      const response = await client.models.embedContent({
        model,
        contents: inputs,
      });
      const embeddings = response.embeddings?.map((e) => e.values ?? []) ?? [];
      if (embeddings.length > 0 && embeddings[0].length > 0) {
        console.log(`[embed] Using model: ${model}`);
        return embeddings;
      }
    } catch (err) {
      console.warn(`[embed] Model ${model} failed:`, err instanceof Error ? err.message : err);
      lastError = err;
    }
  }
  throw lastError ?? new Error("All embedding models failed.");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { inputs } = await request.json();

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json({ error: "Missing or invalid 'inputs' array" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const client = new GoogleGenAI({ apiKey });
    const embeddings = await generateEmbeddingsWithFallback(client, inputs);

    return NextResponse.json({ embeddings });
  } catch (err) {
    console.error("[embed] Error generating embeddings:", err);
    return NextResponse.json(
      {
        error: "Failed to generate embeddings",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

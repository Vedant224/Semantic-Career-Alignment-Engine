import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// gemini-embedding-001: supports individual embeddings per input (batch-capable) — try first.
// gemini-embedding-2: produces ONE aggregated embedding for multiple inputs; used per-item as fallback.
const BATCH_MODEL = "gemini-embedding-001";
const SINGLE_MODEL = "gemini-embedding-2";

async function generateEmbeddingsWithFallback(
  client: GoogleGenAI,
  inputs: string[]
): Promise<number[][]> {
  // Attempt 1: batch with gemini-embedding-001
  try {
    const response = await client.models.embedContent({
      model: BATCH_MODEL,
      contents: inputs,
    });
    const embeddings = response.embeddings?.map((e) => e.values ?? []) ?? [];
    if (embeddings.length === inputs.length && embeddings[0].length > 0) {
      console.log(`[embed] Using model: ${BATCH_MODEL} (batch)`);
      return embeddings;
    }
  } catch (err) {
    console.warn(`[embed] Model ${BATCH_MODEL} failed:`, err instanceof Error ? err.message : err);
  }

  // Attempt 2: gemini-embedding-2 called individually per text
  console.log(`[embed] Falling back to ${SINGLE_MODEL} per-item...`);
  const embeddings: number[][] = [];
  for (const text of inputs) {
    const result = await client.models.embedContent({
      model: SINGLE_MODEL,
      contents: text,
    });
    const values = result.embeddings?.[0]?.values ?? [];
    if (values.length === 0) throw new Error(`${SINGLE_MODEL} returned empty embedding`);
    embeddings.push(values);
  }
  console.log(`[embed] Using model: ${SINGLE_MODEL} (per-item)`);
  return embeddings;
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

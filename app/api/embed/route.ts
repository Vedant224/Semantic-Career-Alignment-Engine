import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

    // The embedContent model for semantic search
    const response = await client.models.embedContent({
      model: "text-embedding-004",
      contents: inputs,
    });

    // Extract embeddings from the response
    const embeddings = response.embeddings?.map(e => e.values) || [];

    if (embeddings.length === 0) {
      return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
    }

    return NextResponse.json({ embeddings });
  } catch (err) {
    console.error("[embed] Error generating embeddings:", err);
    return NextResponse.json(
      { error: "Failed to generate embeddings", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

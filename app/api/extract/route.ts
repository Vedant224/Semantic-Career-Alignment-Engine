import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CareerGraph } from "@/lib/types";

// ─── Gemini client ──────────────────────────────────────────────────────────

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

// ─── Schema Definition ──────────────────────────────────────────────────────

const CareerGraphSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    profileName: { type: Type.STRING, description: "Full name of the candidate" },
    headline: { type: Type.STRING, description: "Professional headline or current job title" },
    contact: {
      type: Type.OBJECT,
      properties: {
        email: { type: Type.STRING },
        phone: { type: Type.STRING },
        location: { type: Type.STRING },
        website: { type: Type.STRING },
        github: { type: Type.STRING },
        linkedin: { type: Type.STRING },
      },
      required: ["email", "phone", "location", "website", "github", "linkedin"]
    },
    experiences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Generate a unique ID starting with exp- e.g. exp-123" },
          role: { type: Type.STRING },
          company: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING, description: "e.g. 2021 or Jan 2021" },
          endDate: { type: Type.STRING, description: "e.g. Present or 2023" },
          description: { type: Type.STRING, description: "Full description of responsibilities and achievements" },
          skills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Leave empty array" },
          metrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "Generate unique ID e.g. m-1" },
                label: { type: Type.STRING, description: "Name of the metric e.g. Revenue Growth" },
                value: { type: Type.STRING, description: "Value e.g. 30%" },
              },
              required: ["id", "label", "value"]
            }
          },
        },
        required: ["id", "role", "company", "location", "startDate", "endDate", "description", "skills", "metrics"]
      }
    },
    skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Generate unique ID e.g. s-1" },
          name: { type: Type.STRING },
          level: { type: Type.STRING, description: "Must be Beginner, Intermediate, Advanced, or Expert" },
          years: { type: Type.INTEGER, description: "Estimated years of experience (number)" },
          category: { type: Type.STRING, description: "Must be exactly one of: Languages, Frontend, Backend, Databases, DevOps & Tools, Core Skills" },
        },
        required: ["id", "name", "level", "years", "category"]
      }
    },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Generate unique ID e.g. proj-1" },
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          techStack: { type: Type.STRING },
          link: { type: Type.STRING },
          highlight: { type: Type.STRING },
        },
        required: ["id", "name", "description", "techStack", "link", "highlight"]
      }
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Generate unique ID e.g. edu-1" },
          institution: { type: Type.STRING },
          degree: { type: Type.STRING },
          period: { type: Type.STRING },
          location: { type: Type.STRING },
          startDate: { type: Type.STRING },
          endDate: { type: Type.STRING },
        },
        required: ["id", "institution", "degree", "location", "startDate", "endDate"]
      }
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Generate unique ID e.g. cert-1" },
          name: { type: Type.STRING },
          issuer: { type: Type.STRING },
          link: { type: Type.STRING },
        },
        required: ["id", "name", "issuer", "link"]
      }
    },
  },
  required: ["profileName", "headline", "contact", "experiences", "skills", "projects", "education", "certifications"]
};

// ─── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'text' field" }, { status: 400 });
    }

    const client = getGeminiClient();

    const prompt = `You are an expert ATS resume parser. Extract the following raw resume text into a structured JSON Career Graph format. 
Make sure to extract as much detail as possible, and categorize skills correctly. Ensure the structure perfectly matches the provided schema.
Extract metrics from the experience descriptions where appropriate. Estimate skill years of experience based on the dates in the resume if possible, otherwise default to 1.

Raw Resume:
${text}
`;

    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: CareerGraphSchema,
        temperature: 0.1,
      },
    });

    if (!response.text) {
      throw new Error("No text returned from Gemini");
    }

    const parsedData = JSON.parse(response.text) as CareerGraph;

    return NextResponse.json({ data: parsedData });
  } catch (err) {
    console.error("[extract] Failed to parse resume:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

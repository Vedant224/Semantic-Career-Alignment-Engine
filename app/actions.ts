"use server"

import { generateText } from "ai"
import { revalidatePath } from "next/cache"
import { getCareerGraph, saveCareerGraph } from "@/lib/career-store"
import { runAlignment } from "@/lib/matching"
import type { AlignmentResult, CareerGraph } from "@/lib/types"

const SUMMARY_MODEL = "openai/gpt-5.4-mini"

/**
 * Generate a tailored, role-aware professional summary using the AI Gateway.
 * Falls back to a deterministic summary (handled by runAlignment) on any error.
 */
async function generateTailoredSummary(
  graph: CareerGraph,
  jobDescription: string,
  jobSkills: string[],
): Promise<string | undefined> {
  try {
    const skillNames = graph.skills.map((s) => `${s.name} (${s.level})`).join(", ")
    const roles = graph.experiences
      .map((e) => `${e.role} at ${e.company}: ${e.description}`)
      .join("\n")

    const { text } = await generateText({
      model: SUMMARY_MODEL,
      system:
        "You are an expert resume writer. Write a concise, ATS-friendly professional summary " +
        "in third-person-free, confident first-person-implied voice (no 'I'). " +
        "2-3 sentences, 55 words max. Emphasize the candidate's real strengths that align " +
        "with the target role. Never invent employers, titles, or facts not provided. " +
        "Return ONLY the summary text, no preamble or quotes.",
      prompt:
        `TARGET ROLE / JOB DESCRIPTION:\n${jobDescription}\n\n` +
        `KEY REQUIREMENTS DETECTED: ${jobSkills.join(", ") || "n/a"}\n\n` +
        `CANDIDATE HEADLINE: ${graph.headline}\n` +
        `CANDIDATE SKILLS: ${skillNames}\n` +
        `CANDIDATE EXPERIENCE:\n${roles}\n\n` +
        `CURRENT SUMMARY (for tone reference): ${graph.summary}\n\n` +
        `Write the tailored professional summary now.`,
    })

    const cleaned = text.trim().replace(/^["']|["']$/g, "").trim()
    return cleaned.length > 0 ? cleaned : undefined
  } catch (error) {
    console.log("[v0] AI summary generation failed, using fallback:", error)
    return undefined
  }
}

/**
 * Process a target job description against the stored career graph and return
 * the alignment result + generated resume (with an AI-tailored summary).
 */
export async function alignToJobDescription(
  jobDescription: string,
): Promise<AlignmentResult> {
  const trimmed = jobDescription.trim()
  if (trimmed.length < 20) {
    throw new Error("Please paste a longer job description to analyze.")
  }

  const graph = await getCareerGraph()

  // First pass to surface detected job skills for the AI prompt.
  const preliminary = runAlignment(graph, trimmed)
  const aiSummary = await generateTailoredSummary(graph, trimmed, preliminary.jobSkills)

  return runAlignment(graph, trimmed, aiSummary)
}

/** Persist edits to the Master Career Graph. */
export async function updateCareerGraph(graph: CareerGraph): Promise<{ ok: true }> {
  await saveCareerGraph(graph)
  revalidatePath("/")
  revalidatePath("/career-graph")
  return { ok: true }
}

/** Read the current career graph (used to hydrate the form). */
export async function fetchCareerGraph(): Promise<CareerGraph> {
  return getCareerGraph()
}

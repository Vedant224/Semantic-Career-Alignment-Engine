"use server"

import { getCareerGraph, saveCareerGraph } from "@/lib/career-store"
import { runAlignment } from "@/lib/matching"
import type { AlignmentResult, CareerGraph } from "@/lib/types"

/**
 * Process a target job description against the stored career graph and return
 * the alignment result + generated resume.
 */
export async function alignToJobDescription(
  jobDescription: string,
): Promise<AlignmentResult> {
  const trimmed = jobDescription.trim()
  if (trimmed.length < 20) {
    throw new Error("Please paste a longer job description to analyze.")
  }

  const graph = await getCareerGraph()
  return runAlignment(graph, trimmed)
}

/** Persist edits to the Master Career Graph. */
export async function updateCareerGraph(graph: CareerGraph): Promise<{ ok: true }> {
  await saveCareerGraph(graph)
  return { ok: true }
}

/** Read the current career graph (used to hydrate the form). */
export async function fetchCareerGraph(): Promise<CareerGraph> {
  return getCareerGraph()
}

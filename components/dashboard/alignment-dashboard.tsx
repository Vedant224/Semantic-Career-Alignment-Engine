"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles, ClipboardPaste, ArrowRight } from "lucide-react"
import { ResumePanel } from "./resume-panel"
import { AlignmentSummary } from "./alignment-summary"
import { cn } from "@/lib/utils"
import { useCareerData } from "@/lib/use-career-data"
import type { AlignmentResult } from "@/lib/types"

const SAMPLE_JD = `Senior Full-Stack Engineer

We are looking for an engineer experienced in TypeScript, React, and Next.js to build data-intensive products. You will design PostgreSQL schemas and work with pgvector for semantic search and embeddings. Experience with AWS, CI/CD, and distributed systems is required. Bonus: knowledge of LLMs and machine learning. Leadership and mentorship of junior engineers expected.`

export function AlignmentDashboard() {
  const [jd, setJd] = useState("")
  const [result, setResult] = useState<AlignmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Preview vs. edit is lifted here so the whole workspace can reflow:
  // editing expands to a full-width editor + live preview split.
  const [mode, setMode] = useState<"preview" | "edit">("preview")
  
  const { graph } = useCareerData()

  function analyze() {
    setError(null)
    startTransition(async () => {
      try {
        if (!graph) {
          throw new Error("Career graph is empty or still loading.")
        }

        const response = await fetch("/api/align", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ careerGraph: graph, jobDescription: jd }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Failed to align job description")
        }

        const res = await response.json()
        setResult(res)
        setMode("preview")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.")
      }
    })
  }

  const editing = mode === "edit" && !!result

  return (
    <div
      className={cn(
        editing
          ? "block"
          : "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-start",
      )}
    >
      {/* Left: editor column — paste the role, read the score. Hidden while
          editing the resume so the editor + preview get the full width. */}
      {!editing && (
      <div className="flex flex-col gap-6 animate-fade-up">
        {/* Stage 1 — paste the target role */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-accent ring-1 ring-inset ring-border">
                <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
              </span>
              Target job description
            </div>
            <button
              type="button"
              onClick={() => setJd(SAMPLE_JD)}
              className="rounded-md px-2 py-1 font-mono text-xs font-medium uppercase tracking-wider text-accent transition hover:bg-accent/10"
            >
              Use sample
            </button>
          </div>
          <div className="p-4 sm:p-5">
            <label htmlFor="jd" className="sr-only">
              Job description
            </label>
            <textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here. The engine extracts required skills and compares them to your career graph..."
              className="h-[220px] w-full resize-y rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card focus:ring-4 focus:ring-accent/10"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-muted-foreground">
                {jd.trim().length} chars
              </span>
              <button
                type="button"
                onClick={analyze}
                disabled={isPending || jd.trim().length < 20}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition",
                  "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                )}
                {isPending ? "Analyzing" : "Analyze & align"}
                {!isPending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
            {error && (
              <p className="mt-3 rounded-lg border border-[color:var(--gap)]/30 bg-[color:var(--gap)]/8 px-3 py-2 text-sm text-[color:var(--gap)]">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Stage 2 — alignment score */}
        {result && <AlignmentSummary result={result} />}
      </div>
      )}

      {/* Right: resume — preview pins beside the rail; editing takes full width */}
      <div className={cn("animate-fade-up", editing ? "" : "lg:sticky lg:top-24 lg:self-start")}>
        <ResumePanel result={result} mode={mode} onModeChange={setMode} />
      </div>
    </div>
  )
}

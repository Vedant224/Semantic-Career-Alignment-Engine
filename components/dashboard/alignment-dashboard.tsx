"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles, ClipboardPaste, ArrowRight } from "lucide-react"
import { alignToJobDescription } from "@/app/actions"
import type { AlignmentResult } from "@/lib/types"
import { ResumePanel } from "./resume-panel"
import { AlignmentSummary } from "./alignment-summary"
import { cn } from "@/lib/utils"

const SAMPLE_JD = `Senior Full-Stack Engineer

We are looking for an engineer experienced in TypeScript, React, and Next.js to build data-intensive products. You will design PostgreSQL schemas and work with pgvector for semantic search and embeddings. Experience with AWS, CI/CD, and distributed systems is required. Bonus: knowledge of LLMs and machine learning. Leadership and mentorship of junior engineers expected.`

export function AlignmentDashboard() {
  const [jd, setJd] = useState("")
  const [result, setResult] = useState<AlignmentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function analyze() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await alignToJobDescription(jd)
        setResult(res)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.")
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Left: Job description input */}
      <section className="flex flex-col gap-4 animate-fade-up">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-secondary px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
              <ClipboardPaste className="h-4 w-4 text-primary" aria-hidden="true" />
              Target job description
            </div>
            <button
              type="button"
              onClick={() => setJd(SAMPLE_JD)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Use sample
            </button>
          </div>
          <div className="p-4">
            <label htmlFor="jd" className="sr-only">
              Job description
            </label>
            <textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here. The engine extracts required skills and compares them to your career graph..."
              className="h-[320px] w-full resize-none rounded-md border border-input bg-card p-4 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{jd.trim().length} characters</span>
              <button
                type="button"
                onClick={analyze}
                disabled={isPending || jd.trim().length < 20}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition",
                  "hover:bg-foreground disabled:cursor-not-allowed disabled:opacity-50",
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
            {error && <p className="mt-3 text-sm text-[color:var(--gap)]">{error}</p>}
          </div>
        </div>

        {result && <AlignmentSummary result={result} />}
      </section>

      {/* Right: Generated resume */}
      <section className="animate-fade-up lg:sticky lg:top-24 lg:self-start">
        <ResumePanel result={result} />
      </section>
    </div>
  )
}

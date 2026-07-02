"use client"

import { useState } from "react"
import { Bot, Loader2, Sparkles, X } from "lucide-react"
import type { CareerGraph } from "@/lib/types"

interface ResumeExtractorProps {
  onExtract: (graph: CareerGraph) => void
}

export function ResumeExtractor({ onExtract }: ResumeExtractorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!text.trim()) {
      setError("Please paste some resume text first.")
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to extract resume")
      }

      const { data } = await res.json()
      onExtract(data)
      setIsOpen(false)
      setText("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent/10 px-4 py-2.5 text-sm font-semibold text-accent shadow-sm transition-all hover:bg-accent/20 active:scale-[0.98]"
        title="Paste your resume and let AI fill the form"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        AI Resume Extract
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] sm:w-[480px] origin-top-right rounded-2xl border border-border bg-card p-4 shadow-xl animate-in fade-in zoom-in-95">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground">
              <Bot className="h-4 w-4 text-accent" />
              <span className="font-semibold text-sm">Paste Resume Text</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="mb-3 text-xs text-muted-foreground">
            Paste your raw resume text below. Our AI will automatically extract your skills, experience, and projects into the Career Graph format.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Experience\nSoftware Engineer at TechCorp\n- Built scalable APIs...\n\nSkills\nReact, Node.js..."
            className="h-48 w-full resize-none rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card mb-3"
          />

          {error && (
            <p className="mb-3 text-xs text-[color:var(--gap)] font-medium bg-[color:var(--gap)]/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !text.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {isExtracting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {isExtracting ? "Extracting..." : "Extract & Fill"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

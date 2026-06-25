"use client"

import { useState } from "react"
import { FileText, Sparkles, Download, Code } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { generateLatexResume, downloadLatex, generatePdfFromHtml } from "@/lib/latex-generator"
import { PrintableResume } from "./printable-resume"

export function ResumePanel({ result }: { result: AlignmentResult | null }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadPdf = async () => {
    if (!result) return
    setIsExporting(true)
    try {
      const element = document.getElementById("resume-print")
      if (!element) throw new Error("Printable resume element not found")
      await generatePdfFromHtml(element, "resume.pdf")
    } catch (error) {
      console.error("[v0] PDF download error:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadLatex = () => {
    if (!result) return
    const latex = generateLatexResume(result)
    downloadLatex(latex, "resume.tex")
  }
  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
          Your optimized resume appears here
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Paste a job description on the left and run the analysis. The engine
          reorders your experience and emphasizes JD-relevant achievements.
        </p>
      </div>
    )
  }

  const { resume } = result

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Optimized resume
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadLatex}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 text-primary"
            title="Download as LaTeX file"
          >
            <Code className="h-3.5 w-3.5" aria-hidden="true" />
            LaTeX
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-primary/10 text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download as PDF"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {isExporting ? "Exporting..." : "PDF"}
          </button>
        </div>
      </div>

      <div id="resume-content" className="space-y-6 p-6">
        <header>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
            {resume.name}
          </h2>
          <p className="mt-0.5 text-base text-primary">{resume.headline}</p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{resume.summary}</p>
        </header>

        <section>
          <SectionTitle>Core Skills</SectionTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {resume.coreSkills.map((skill, i) => (
              <span
                key={skill}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  i < 4
                    ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Experience</SectionTitle>
          <div className="mt-3 space-y-5">
            {resume.experiences.map((exp) => (
              <article key={`${exp.role}-${exp.company}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="font-medium text-foreground">
                    {exp.role}{" "}
                    <span className="font-normal text-muted-foreground">· {exp.company}</span>
                  </h4>
                  <span className="shrink-0 text-xs text-muted-foreground">{exp.period}</span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {exp.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex gap-2 text-sm leading-relaxed",
                        bullet.emphasized ? "text-foreground" : "text-foreground/70",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                          bullet.emphasized ? "bg-primary" : "bg-border",
                        )}
                        aria-hidden="true"
                      />
                      <span>
                        {bullet.text}
                        {bullet.emphasized && (
                          <span className="ml-1.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-primary">
                            JD match
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>
      <PrintableResume result={result} />
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
      {children}
    </h3>
  )
}

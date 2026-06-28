"use client"

import { useState, useEffect } from "react"
import { FileText, Sparkles, Download, Code, FileType, Loader2 } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import {
  generateLatexResume,
  downloadLatex,
  downloadResumePdf,
  compileResumePdf,
} from "@/lib/latex-generator"

export function ResumePanel({ result }: { result: AlignmentResult | null }) {
  const [isExporting, setIsExporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "error">("idle")

  // Compile the true LaTeX PDF whenever the result changes. Revokes old object
  // URLs to avoid memory leaks.
  useEffect(() => {
    if (!result) return
    let cancelled = false
    let createdUrl: string | null = null
    setPdfStatus("loading")
    compileResumePdf(result)
      .then((blob) => {
        if (cancelled) return
        createdUrl = URL.createObjectURL(blob)
        setPdfUrl(createdUrl)
        setPdfStatus("idle")
      })
      .catch((error) => {
        console.log("[v0] PDF preview compile failed:", error)
        if (!cancelled) setPdfStatus("error")
      })
    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [result])

  const handleDownloadPdf = async () => {
    if (!result) return
    setIsExporting(true)
    setNotice(null)
    try {
      const engine = await downloadResumePdf(result, "resume.pdf")
      if (engine === "fallback") {
        setNotice(
          "The LaTeX engine was unreachable, so we generated a built-in PDF instead. Try again shortly for the exact LaTeX version.",
        )
      }
    } catch (error) {
      console.error("[v0] PDF download error:", error)
      setNotice("Failed to generate PDF. Please try again.")
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
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-primary">
          <FileText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-xl font-semibold text-foreground">
          Your optimized resume appears here
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Paste a job description on the left and run the analysis. The engine
          reorders your experience and emphasizes JD-relevant achievements.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-6 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          Optimized resume
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadLatex}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            title="Download as LaTeX file"
          >
            <Code className="h-3.5 w-3.5" aria-hidden="true" />
            LaTeX
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            title="Download as PDF"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {isExporting ? "Compiling LaTeX..." : "PDF"}
          </button>
        </div>
      </div>

      {notice && (
        <div className="border-b border-border bg-[color:var(--partial)]/10 px-6 py-2.5 text-xs text-[color:var(--partial-foreground)]">
          <span className="text-foreground/80">{notice}</span>
        </div>
      )}

      {/* True LaTeX-compiled PDF */}
      <div className="bg-secondary p-4 sm:p-6">
        {pdfStatus === "loading" && (
          <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm">Compiling your resume with LaTeX…</p>
          </div>
        )}
        {pdfStatus === "error" && (
          <div className="flex h-[80vh] flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
            <FileType className="h-8 w-8 text-primary" aria-hidden="true" />
            <p className="max-w-md text-sm">
              The LaTeX engine is temporarily unreachable, so the PDF can&apos;t be rendered right
              now. Use the PDF download button above — it falls back to a built-in generator so you
              always get a file.
            </p>
          </div>
        )}
        {pdfStatus === "idle" && pdfUrl && (
          <iframe
            src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
            title="Compiled LaTeX resume PDF"
            className="h-[80vh] w-full rounded-lg border border-border bg-card"
          />
        )}
      </div>
    </div>
  )
}

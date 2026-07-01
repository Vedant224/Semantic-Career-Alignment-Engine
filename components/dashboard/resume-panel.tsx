"use client"

import { useState, useEffect, useRef } from "react"
import {
  FileText,
  Sparkles,
  Download,
  Code,
  FileType,
  Loader2,
  Eye,
  Pencil,
} from "lucide-react"
import type { AlignmentResult, GeneratedResume } from "@/lib/types"
import {
  generateLatexResume,
  downloadLatex,
  downloadResumePdf,
  compileResumePdf,
} from "@/lib/latex-generator"
import { ResumeEditor } from "./resume-editor"
import { cn } from "@/lib/utils"

type Mode = "preview" | "edit"

export function ResumePanel({
  result,
  mode = "preview",
  onModeChange,
}: {
  result: AlignmentResult | null
  mode?: Mode
  onModeChange?: (m: Mode) => void
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfStatus, setPdfStatus] = useState<"idle" | "loading" | "error">("idle")

  // Editable copy of the generated resume — edits here drive the live preview.
  const [resume, setResume] = useState<GeneratedResume | null>(result?.resume ?? null)

  const resultRef = useRef(result)
  resultRef.current = result

  // Reset the editable resume whenever a fresh analysis arrives.
  useEffect(() => {
    setResume(result?.resume ?? null)
  }, [result])

  // Recompile the true LaTeX PDF (debounced) whenever the edited resume changes.
  useEffect(() => {
    const base = resultRef.current
    if (!base || !resume) return
    let cancelled = false
    let createdUrl: string | null = null
    setPdfStatus("loading")
    const timer = setTimeout(() => {
      compileResumePdf({ ...base, resume })
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
    }, 700)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [resume])

  const effectiveResult = result && resume ? { ...result, resume } : result

  const handleDownloadPdf = async () => {
    if (!effectiveResult) return
    setIsExporting(true)
    setNotice(null)
    try {
      const engine = await downloadResumePdf(effectiveResult, "resume.pdf")
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
    if (!effectiveResult) return
    downloadLatex(generateLatexResume(effectiveResult), "resume.tex")
  }

  if (!result || !resume) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-accent ring-1 ring-inset ring-border">
          <FileText className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
          Your optimized resume appears here
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Paste a job description on the left and run the analysis. The engine
          reorders your experience and emphasizes JD-relevant achievements — then
          you can fine-tune every detail before exporting.
        </p>
      </div>
    )
  }

  const editing = mode === "edit"

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-accent ring-1 ring-inset ring-border">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          {editing ? "Edit resume" : "Optimized resume"}
        </div>

        <div className="flex items-center gap-2">
          {/* Preview / Edit toggle */}
          <div className="flex rounded-lg border border-border bg-secondary p-0.5">
            <ModeButton
              active={mode === "preview"}
              onClick={() => onModeChange?.("preview")}
              icon={Eye}
              label="Preview"
            />
            <ModeButton
              active={mode === "edit"}
              onClick={() => onModeChange?.("edit")}
              icon={Pencil}
              label="Edit"
            />
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleDownloadLatex}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/25 hover:bg-secondary"
              title="Download as LaTeX file"
            >
              <Code className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="hidden sm:inline">LaTeX</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              title="Download as PDF"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {isExporting ? "Compiling…" : "PDF"}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <div className="border-b border-border bg-[color:var(--partial)]/10 px-6 py-2.5 text-xs">
          <span className="text-foreground/80">{notice}</span>
        </div>
      )}

      {editing ? (
        /* Editor + live preview, side by side and full width */
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Editor column */}
          <div className="flex min-w-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2 text-xs font-medium text-muted-foreground sm:px-5">
              <Pencil className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Edit content — changes apply to the preview automatically
            </div>
            <div className="overflow-y-auto lg:h-[calc(100vh-12rem)] lg:min-h-[560px]">
              <ResumeEditor resume={resume} onChange={setResume} />
            </div>
          </div>

          {/* Live preview column */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2 text-xs font-medium text-muted-foreground sm:px-5">
              {pdfStatus === "loading" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" aria-hidden="true" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[color:var(--match)]" aria-hidden="true" />
              )}
              {pdfStatus === "loading" ? "Rebuilding preview…" : "Live preview"}
            </div>
            <div className="bg-secondary p-3 lg:h-[calc(100vh-12rem)] lg:min-h-[560px]">
              <PreviewArea pdfStatus={pdfStatus} pdfUrl={pdfUrl} full />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-secondary p-3 sm:p-4">
          <PreviewArea pdfStatus={pdfStatus} pdfUrl={pdfUrl} />
        </div>
      )}
    </div>
  )
}

function PreviewArea({
  pdfStatus,
  pdfUrl,
  full,
}: {
  pdfStatus: "idle" | "loading" | "error"
  pdfUrl: string | null
  full?: boolean
}) {
  // In the edit split the parent sets the height; in preview mode fill the viewport.
  const h = full ? "h-full min-h-[520px]" : "h-[calc(100vh-9.5rem)] min-h-[520px]"

  if (pdfStatus === "loading") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 text-muted-foreground", h)}>
        <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden="true" />
        <p className="text-sm">Compiling your resume with LaTeX…</p>
      </div>
    )
  }
  if (pdfStatus === "error") {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground", h)}>
        <FileType className="h-8 w-8 text-accent" aria-hidden="true" />
        <p className="max-w-md text-sm">
          The LaTeX engine is temporarily unreachable, so the PDF can&apos;t be rendered right now.
          Use the PDF download button above — it falls back to a built-in generator so you always get
          a file.
        </p>
      </div>
    )
  }
  if (pdfUrl) {
    return (
      <iframe
        src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        title="Compiled LaTeX resume PDF"
        className={cn("w-full rounded-lg border border-border bg-card", h)}
      />
    )
  }
  return null
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Eye
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

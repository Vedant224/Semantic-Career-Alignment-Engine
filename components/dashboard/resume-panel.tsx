"use client"

import { useState } from "react"
import { FileText, Sparkles, Download, Code } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import { generateLatexResume, downloadLatex, generateResumePdf } from "@/lib/latex-generator"

// Match the exact colors used in the generated PDF so the on-screen
// "paper" preview is a true what-you-see-is-what-you-download document.
const NAVY = "#0a3061"
const ROYAL = "#4169e1"
const INK = "#1f2937"
const MUTED = "#5a6473"

export function ResumePanel({ result }: { result: AlignmentResult | null }) {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownloadPdf = async () => {
    if (!result) return
    setIsExporting(true)
    try {
      await generateResumePdf(result, "resume.pdf")
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
            {isExporting ? "Exporting..." : "PDF"}
          </button>
        </div>
      </div>

      {/* Paper-style document — what you see is what you download */}
      <div className="max-h-[80vh] overflow-y-auto bg-secondary/30 p-4 sm:p-6">
        <article
          className="mx-auto max-w-[820px] bg-white px-9 py-9 font-serif text-[13px] leading-snug shadow-md sm:px-12 sm:py-11"
          style={{ color: INK }}
          aria-label="Resume preview"
        >
          {/* Heading */}
          <header className="text-center">
            <h2
              className="text-2xl font-bold uppercase tracking-wide"
              style={{ color: NAVY, fontVariant: "small-caps" }}
            >
              {resume.name}
            </h2>
            <p className="mt-1 text-sm" style={{ color: ROYAL }}>
              {resume.headline}
            </p>
          </header>

          {/* Professional Summary */}
          <PaperSection title="Professional Summary">
            <p className="text-justify leading-relaxed">{resume.summary}</p>
          </PaperSection>

          {/* Technical Skills */}
          {resume.skillGroups.some((g) => g.items.length > 0) && (
            <PaperSection title="Technical Skills">
              <ul className="space-y-1">
                {resume.skillGroups
                  .filter((g) => g.items.length > 0)
                  .map((group) => (
                    <li key={group.label} className="leading-relaxed">
                      <span className="font-bold" style={{ color: NAVY }}>
                        {group.label}:
                      </span>{" "}
                      {group.items.join(", ")}
                    </li>
                  ))}
              </ul>
            </PaperSection>
          )}

          {/* Professional Experience */}
          {resume.experiences.length > 0 && (
            <PaperSection title="Professional Experience">
              <div className="space-y-3">
                {resume.experiences.map((exp) => (
                  <div key={`${exp.role}-${exp.company}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">
                        {exp.company}
                        {exp.location && <span className="font-normal">{`  •  ${exp.location}`}</span>}
                      </span>
                      <span className="shrink-0 text-[12px] font-bold">{exp.period}</span>
                    </div>
                    <p className="italic" style={{ color: MUTED }}>
                      {exp.role}
                    </p>
                    <PaperBullets bullets={exp.bullets} />
                  </div>
                ))}
              </div>
            </PaperSection>
          )}

          {/* Technical Projects */}
          {resume.projects.length > 0 && (
            <PaperSection title="Technical Projects">
              <div className="space-y-3">
                {resume.projects.map((proj) => (
                  <div key={proj.name}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">
                        {proj.name}
                        {proj.techStack && (
                          <span className="font-normal italic" style={{ color: MUTED }}>
                            {`  |  ${proj.techStack}`}
                          </span>
                        )}
                      </span>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[12px] font-bold hover:underline"
                          style={{ color: ROYAL }}
                        >
                          LINK
                        </a>
                      )}
                    </div>
                    {proj.highlight && (
                      <p style={{ color: NAVY }}>{proj.highlight}</p>
                    )}
                    <PaperBullets bullets={proj.bullets} />
                  </div>
                ))}
              </div>
            </PaperSection>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <PaperSection title="Education">
              <div className="space-y-2">
                {resume.education.map((edu) => (
                  <div key={`${edu.institution}-${edu.degree}`}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-bold">
                        {edu.institution}
                        {edu.location && <span className="font-normal">{`  •  ${edu.location}`}</span>}
                      </span>
                      <span className="shrink-0 text-[12px] font-bold">{edu.period}</span>
                    </div>
                    <p className="italic" style={{ color: MUTED }}>
                      {edu.degree}
                    </p>
                  </div>
                ))}
              </div>
            </PaperSection>
          )}

          {/* Achievements & Certifications */}
          {resume.certifications.length > 0 && (
            <PaperSection title="Achievements & Certifications">
              <ul className="space-y-1">
                {resume.certifications.map((cert) => (
                  <li key={cert.name} className="flex gap-2 leading-relaxed">
                    <span aria-hidden="true" style={{ color: MUTED }}>
                      •
                    </span>
                    <span>
                      <span className="font-bold">{cert.name}</span>
                      {cert.issuer && <span>{` — ${cert.issuer}`}</span>}
                      {cert.link && (
                        <a
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 text-[12px] hover:underline"
                          style={{ color: ROYAL }}
                        >
                          View credential
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </PaperSection>
          )}
        </article>
      </div>
    </div>
  )
}

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4">
      <h3
        className="mb-1.5 border-b pb-0.5 text-[13px] font-bold uppercase tracking-wide"
        style={{ color: NAVY, borderColor: NAVY }}
      >
        {title}
      </h3>
      {children}
    </section>
  )
}

function PaperBullets({ bullets }: { bullets: { text: string; emphasized: boolean }[] }) {
  return (
    <ul className="mt-1 space-y-0.5">
      {bullets.map((bullet, i) => (
        <li key={i} className="flex gap-2 leading-relaxed">
          <span
            aria-hidden="true"
            style={{ color: bullet.emphasized ? ROYAL : MUTED }}
          >
            •
          </span>
          <span
            className={bullet.emphasized ? "font-semibold" : ""}
            style={{ color: bullet.emphasized ? ROYAL : INK }}
          >
            {bullet.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

"use client"

import { useState } from "react"
import { FileText, Sparkles, Download, Code, ExternalLink } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import { cn } from "@/lib/utils"
import { generateLatexResume, downloadLatex, generateResumePdf } from "@/lib/latex-generator"

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
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground/80">{resume.summary}</p>
          </div>
        </header>

        {resume.skillGroups.length > 0 && (
          <section>
            <SectionTitle>Technical Skills</SectionTitle>
            <div className="mt-3 space-y-2.5">
              {resume.skillGroups.map((group) => (
                <div key={group.label} className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
                  <span className="shrink-0 pt-1 text-xs font-semibold text-foreground sm:w-32">
                    {group.label}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle>Professional Experience</SectionTitle>
          <div className="mt-3 space-y-5">
            {resume.experiences.map((exp) => (
              <article key={`${exp.role}-${exp.company}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="font-medium text-foreground">
                    {exp.company}
                    {exp.location && (
                      <span className="font-normal text-muted-foreground"> · {exp.location}</span>
                    )}
                  </h4>
                  <span className="shrink-0 text-xs text-muted-foreground">{exp.period}</span>
                </div>
                <p className="text-sm italic text-muted-foreground">{exp.role}</p>
                <ul className="mt-2 space-y-1.5">
                  {exp.bullets.map((bullet, i) => (
                    <Bullet key={i} bullet={bullet} />
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {resume.projects.length > 0 && (
          <section>
            <SectionTitle>Technical Projects</SectionTitle>
            <div className="mt-3 space-y-5">
              {resume.projects.map((proj) => (
                <article key={proj.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-medium text-foreground">
                      {proj.name}
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">Open {proj.name}</span>
                        </a>
                      )}
                    </h4>
                  </div>
                  {proj.techStack && (
                    <p className="text-xs italic text-muted-foreground">{proj.techStack}</p>
                  )}
                  {proj.highlight && (
                    <p className="mt-0.5 text-xs font-medium text-primary">{proj.highlight}</p>
                  )}
                  <ul className="mt-2 space-y-1.5">
                    {proj.bullets.map((bullet, i) => (
                      <Bullet key={i} bullet={bullet} />
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {resume.education.length > 0 && (
          <section>
            <SectionTitle>Education</SectionTitle>
            <div className="mt-3 space-y-3">
              {resume.education.map((edu) => (
                <div key={`${edu.institution}-${edu.degree}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="font-medium text-foreground">
                      {edu.institution}
                      {edu.location && (
                        <span className="font-normal text-muted-foreground"> · {edu.location}</span>
                      )}
                    </h4>
                    <span className="shrink-0 text-xs text-muted-foreground">{edu.period}</span>
                  </div>
                  <p className="text-sm italic text-muted-foreground">{edu.degree}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.certifications.length > 0 && (
          <section>
            <SectionTitle>Achievements &amp; Certifications</SectionTitle>
            <ul className="mt-3 space-y-1.5">
              {resume.certifications.map((cert) => (
                <li key={cert.name} className="flex gap-2 text-sm leading-relaxed text-foreground/80">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="font-medium text-foreground">{cert.name}</span>
                    {cert.issuer && <span className="text-muted-foreground"> — {cert.issuer}</span>}
                    {cert.link && (
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        Credential
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border pb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
      {children}
    </h3>
  )
}

function Bullet({ bullet }: { bullet: { text: string; emphasized: boolean } }) {
  return (
    <li
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
          <span className="ml-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/20">
            JD&nbsp;match
          </span>
        )}
      </span>
    </li>
  )
}

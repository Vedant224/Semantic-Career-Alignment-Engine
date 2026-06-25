import type { AlignmentResult, GeneratedResume } from "./types"

// Escape special LaTeX characters.
function escapeLatex(str: string): string {
  return str
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
}

/**
 * Generate an ATS-optimized LaTeX resume that mirrors the user's template.
 * Personal/contact details are intentionally omitted.
 */
export function generateLatexResume(result: AlignmentResult): string {
  const { resume } = result

  // ----- Technical Skills (grouped by category) -----
  const skillsLines = resume.skillGroups
    .filter((g) => g.items.length > 0)
    .map(
      (g) =>
        `     \\textbf{${escapeLatex(g.label)}:} ${g.items.map(escapeLatex).join(", ")} \\\\`,
    )
    .join("\n")

  const skillsContent = skillsLines
    ? `\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
${skillsLines}
     }}
 \\end{itemize}`
    : ""

  // ----- Professional Experience -----
  let experienceContent = ""
  resume.experiences.forEach((exp) => {
    const heading = exp.location ? `${exp.company} -- ${exp.location}` : exp.company
    experienceContent += `    \\resumeSubheading\n      {${escapeLatex(heading)}}{${escapeLatex(exp.period)}}\n      {${escapeLatex(exp.role)}}{}\n`
    experienceContent += `      \\resumeItemListStart\n`
    exp.bullets.forEach((bullet) => {
      const text = escapeLatex(bullet.text)
      experienceContent += bullet.emphasized
        ? `        \\resumeItem{\\textcolor{custom2}{${text}}}\n`
        : `        \\resumeItem{${text}}\n`
    })
    experienceContent += `      \\resumeItemListEnd\n`
  })

  // ----- Technical Projects -----
  let projectsContent = ""
  resume.projects.forEach((proj) => {
    const stack = proj.techStack ? ` $|$ \\emph{${escapeLatex(proj.techStack)}}` : ""
    const nameNode = proj.link
      ? `\\href{${proj.link}}{\\textbf{${escapeLatex(proj.name)}}}`
      : `\\textbf{${escapeLatex(proj.name)}}`
    const linkNode = proj.link ? `\\href{${proj.link}}{\\textcolor{custom2}{LINK}}` : ""
    projectsContent += `      \\resumeProjectHeading\n          {${nameNode}${stack}}{${linkNode}}\n`
    if (proj.highlight) {
      projectsContent += `          \\\\[3pt]\n          \\small{${escapeLatex(proj.highlight)}}\n`
    }
    projectsContent += `          \\resumeItemListStart\n`
    proj.bullets.forEach((bullet) => {
      const text = escapeLatex(bullet.text)
      projectsContent += bullet.emphasized
        ? `            \\resumeItem{\\textcolor{custom2}{${text}}}\n`
        : `            \\resumeItem{${text}}\n`
    })
    projectsContent += `          \\resumeItemListEnd\n`
  })

  // ----- Education -----
  let educationContent = ""
  resume.education.forEach((edu) => {
    const heading = edu.location ? `${edu.institution} -- ${edu.location}` : edu.institution
    educationContent += `    \\resumeSubheading\n      {${escapeLatex(heading)}}{${escapeLatex(edu.period)}}\n      {${escapeLatex(edu.degree)}}{}\n`
  })

  // ----- Achievements & Certifications -----
  let certsContent = ""
  resume.certifications.forEach((cert) => {
    const issuer = cert.issuer ? ` -- ${escapeLatex(cert.issuer)}` : ""
    const credential = cert.link ? ` -- \\href{${cert.link}}{\\textcolor{custom2}{Credential}}` : ""
    certsContent += `            \\resumeItem{\\textbf{${escapeLatex(cert.name)}}${issuer}${credential}}\n`
  })

  // Assemble optional sections.
  const sections: string[] = []

  sections.push(`%-----------PROFESSIONAL SUMMARY-----------
\\section{\\textcolor{custom1}{Professional Summary}}
    \\resumeSubHeadingListStart
    \\small{${escapeLatex(resume.summary)}}
    \\resumeSubHeadingListEnd`)

  if (skillsContent) {
    sections.push(`%-----------TECHNICAL SKILLS-----------
\\vspace{-13pt}
\\section{\\textcolor{custom1}{Technical Skills}}
 ${skillsContent}`)
  }

  if (experienceContent) {
    sections.push(`%-----------PROFESSIONAL EXPERIENCE-----------
\\vspace{-13pt}
\\section{\\textcolor{custom1}{Professional Experience}}
  \\resumeSubHeadingListStart
${experienceContent}  \\resumeSubHeadingListEnd`)
  }

  if (projectsContent) {
    sections.push(`%-----------PROJECTS-----------
\\vspace{-13pt}
\\section{\\textcolor{custom1}{Technical Projects}}
    \\resumeSubHeadingListStart
${projectsContent}    \\resumeSubHeadingListEnd`)
  }

  if (educationContent) {
    sections.push(`%-----------EDUCATION-----------
\\vspace{-13pt}
\\section{\\textcolor{custom1}{Education}}
  \\resumeSubHeadingListStart
${educationContent}  \\resumeSubHeadingListEnd`)
  }

  if (certsContent) {
    sections.push(`%-----------ACHIEVEMENTS & CERTIFICATIONS-----------
\\vspace{-13pt}
\\section{\\textcolor{custom1}{Achievements \\& Certifications}}
    \\resumeSubHeadingListStart
        \\resumeItemListStart
${certsContent}        \\resumeItemListEnd
    \\resumeSubHeadingListEnd`)
  }

  return `%-------------------------
% ATS-Optimized Resume in LaTeX
% Generated by Semantic Career Alignment Engine
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}

\\definecolor{custom1}{RGB}{10, 48, 97}
\\definecolor{custom2}{RGB}{65,105,225}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large\\bfseries
}{}{0em}{}[\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

%-------------------------
% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{{#1}} & \\textbf{\\small #2} \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{1.001\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & \\textbf{\\small #2}\\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\renewcommand\\labelitemi{$$\\vcenter{\\hbox{\\tiny$$\\bullet$$}}$$}
\\renewcommand\\labelitemii{$$\\vcenter{\\hbox{\\tiny$$\\bullet$$}}$$}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\\begin{document}

%----------HEADING----------
\\begin{center}
    {\\LARGE \\scshape \\textcolor{custom1}{${escapeLatex(resume.name)}}} \\\\ \\vspace{2pt}
    \\small ${escapeLatex(resume.headline)}
    \\vspace{-5pt}
\\end{center}

${sections.join("\n\n")}

\\end{document}
`
}

export function downloadLatex(content: string, filename = "resume.tex"): void {
  const element = document.createElement("a")
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content))
  element.setAttribute("download", filename)
  element.style.display = "none"
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// Theme colors as RGB tuples for the PDF.
const NAVY: [number, number, number] = [10, 48, 97]
const ROYAL: [number, number, number] = [37, 99, 235]
const BODY: [number, number, number] = [31, 41, 55]
const MUTED: [number, number, number] = [90, 100, 115]

/**
 * Generate a crisp, selectable, lightweight (compressed) vector PDF that
 * mirrors the LaTeX template layout. No rasterization — text stays sharp and
 * the file stays tiny. Auto-scales to fit content and paginates when needed.
 */
export async function generateResumePdf(result: AlignmentResult, filename = "resume.pdf"): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { resume } = result

  // Letter page (matches the LaTeX template), compression on for small files.
  const pageW = 215.9
  const pageH = 279.4
  const marginX = 16
  const usableW = pageW - marginX * 2

  // Try scales until it fits on a single page; otherwise paginate at smallest.
  const scales = [1, 0.94, 0.88, 0.82, 0.78]
  for (let i = 0; i < scales.length; i++) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter", compress: true })
    const pages = renderResume(doc, resume, { pageW, pageH, marginX, usableW, scale: scales[i] })
    if (pages === 1 || i === scales.length - 1) {
      doc.save(filename)
      return
    }
  }
}

function renderResume(
  doc: import("jspdf").jsPDF,
  resume: GeneratedResume,
  cfg: { pageW: number; pageH: number; marginX: number; usableW: number; scale: number },
): number {
  const { pageW, pageH, marginX, usableW, scale } = cfg
  const topMargin = 16
  const bottomLimit = pageH - 14
  let y = topMargin
  let pages = 1

  const fs = (pt: number) => pt * scale
  const lh = (pt: number) => (pt * scale) / 2.6 // approx line height (mm)
  const strW = (text: string, pt: number) => (doc.getStringUnitWidth(text) * fs(pt)) / 2.83

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage()
      pages += 1
      y = topMargin
    }
  }

  // ---- Heading ----
  doc.setFont("helvetica", "bold")
  doc.setFontSize(fs(20))
  doc.setTextColor(...NAVY)
  doc.text(resume.name.toUpperCase(), pageW / 2, y, { align: "center" })
  y += lh(20) + 1

  if (resume.headline) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(fs(10.5))
    doc.setTextColor(...ROYAL)
    doc.text(resume.headline, pageW / 2, y, { align: "center" })
    y += lh(10.5) + 1.5
  }

  const section = (title: string) => {
    ensureSpace(12)
    y += 3
    doc.setFont("helvetica", "bold")
    doc.setFontSize(fs(11.5))
    doc.setTextColor(...NAVY)
    doc.text(title.toUpperCase(), marginX, y)
    y += 1.6
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.35)
    doc.line(marginX, y, pageW - marginX, y)
    y += 4
  }

  const paragraph = (text: string, pt: number, color: [number, number, number], style: "normal" | "italic" = "normal") => {
    doc.setFont("helvetica", style)
    doc.setFontSize(fs(pt))
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, usableW)
    for (const line of lines) {
      ensureSpace(lh(pt) + 1)
      doc.text(line, marginX, y)
      y += lh(pt) + 0.6
    }
  }

  // Render a bullet with a leading dot and JD emphasis color.
  const bullet = (text: string, emphasized: boolean) => {
    const pt = 9.5
    doc.setFont("helvetica", emphasized ? "bold" : "normal")
    doc.setFontSize(fs(pt))
    doc.setTextColor(...(emphasized ? ROYAL : BODY))
    const indent = marginX + 4
    const lines = doc.splitTextToSize(text, usableW - 4)
    lines.forEach((line: string, idx: number) => {
      ensureSpace(lh(pt) + 1)
      if (idx === 0) {
        doc.setTextColor(...(emphasized ? ROYAL : MUTED))
        doc.text("\u2022", marginX + 1, y)
        doc.setTextColor(...(emphasized ? ROYAL : BODY))
      }
      doc.text(line, indent, y)
      y += lh(pt) + 0.5
    })
  }

  // ---- Professional Summary ----
  section("Professional Summary")
  paragraph(resume.summary, 9.5, BODY)

  // ---- Technical Skills ----
  const skillGroups = resume.skillGroups.filter((g) => g.items.length > 0)
  if (skillGroups.length > 0) {
    section("Technical Skills")
    const pt = 9.5
    for (const group of skillGroups) {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fs(pt))
      doc.setTextColor(...NAVY)
      const labelText = `${group.label}: `
      const labelW = strW(labelText, pt)
      const lines = doc.splitTextToSize(group.items.join(", "), usableW - labelW)
      ensureSpace(lh(pt) + 1)
      doc.text(labelText, marginX, y)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...BODY)
      lines.forEach((line: string, i: number) => {
        if (i > 0) {
          ensureSpace(lh(pt) + 1)
        }
        doc.text(line, i === 0 ? marginX + labelW : marginX, y)
        if (i < lines.length - 1) y += lh(pt) + 0.5
      })
      y += lh(pt) + 1.2
    }
  }

  // ---- Professional Experience ----
  if (resume.experiences.length > 0) {
    section("Professional Experience")
    resume.experiences.forEach((exp, idx) => {
      ensureSpace(lh(11) + lh(10) + 4)
      const heading = exp.location ? `${exp.company}  •  ${exp.location}` : exp.company
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fs(10.5))
      doc.setTextColor(...BODY)
      doc.text(heading, marginX, y)
      doc.text(exp.period, pageW - marginX, y, { align: "right" })
      y += lh(10.5) + 0.4
      doc.setFont("helvetica", "italic")
      doc.setFontSize(fs(9.5))
      doc.setTextColor(...MUTED)
      doc.text(exp.role, marginX, y)
      y += lh(9.5) + 1
      exp.bullets.forEach((b) => bullet(b.text, b.emphasized))
      if (idx < resume.experiences.length - 1) y += 1.8
    })
  }

  // ---- Technical Projects ----
  if (resume.projects.length > 0) {
    section("Technical Projects")
    resume.projects.forEach((proj, idx) => {
      ensureSpace(lh(10.5) + 4)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fs(10.5))
      doc.setTextColor(...BODY)
      doc.text(proj.name, marginX, y)
      if (proj.link) {
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...ROYAL)
        doc.textWithLink("LINK", pageW - marginX, y, { align: "right", url: proj.link })
      }
      y += lh(10.5) + 0.4
      if (proj.techStack) {
        doc.setFont("helvetica", "italic")
        doc.setFontSize(fs(9))
        doc.setTextColor(...MUTED)
        doc.text(proj.techStack, marginX, y)
        y += lh(9) + 0.6
      }
      if (proj.highlight) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(fs(9))
        doc.setTextColor(...NAVY)
        const hl = doc.splitTextToSize(proj.highlight, usableW)
        hl.forEach((line: string) => {
          ensureSpace(lh(9) + 1)
          doc.text(line, marginX, y)
          y += lh(9) + 0.4
        })
      }
      proj.bullets.forEach((b) => bullet(b.text, b.emphasized))
      if (idx < resume.projects.length - 1) y += 1.8
    })
  }

  // ---- Education ----
  if (resume.education.length > 0) {
    section("Education")
    resume.education.forEach((edu) => {
      ensureSpace(lh(10.5) + lh(9.5) + 2)
      const heading = edu.location ? `${edu.institution}  •  ${edu.location}` : edu.institution
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fs(10.5))
      doc.setTextColor(...BODY)
      doc.text(heading, marginX, y)
      doc.text(edu.period, pageW - marginX, y, { align: "right" })
      y += lh(10.5) + 0.4
      doc.setFont("helvetica", "italic")
      doc.setFontSize(fs(9.5))
      doc.setTextColor(...MUTED)
      doc.text(edu.degree, marginX, y)
      y += lh(9.5) + 1.6
    })
  }

  // ---- Achievements & Certifications ----
  if (resume.certifications.length > 0) {
    section("Achievements & Certifications")
    const pt = 9.5
    resume.certifications.forEach((cert) => {
      const issuer = cert.issuer ? ` — ${cert.issuer}` : ""
      const text = `${cert.name}${issuer}`
      doc.setFont("helvetica", "bold")
      doc.setFontSize(fs(pt))
      doc.setTextColor(...BODY)
      const indent = marginX + 4
      const lines = doc.splitTextToSize(text, usableW - 4)
      lines.forEach((line: string, idx: number) => {
        ensureSpace(lh(pt) + 1)
        if (idx === 0) {
          doc.setTextColor(...MUTED)
          doc.text("\u2022", marginX + 1, y)
          doc.setTextColor(...BODY)
        }
        doc.text(line, indent, y)
        y += lh(pt) + 0.5
      })
      if (cert.link) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(fs(8.5))
        doc.setTextColor(...ROYAL)
        doc.textWithLink("View credential", indent, y, { url: cert.link })
        y += lh(8.5) + 0.6
      }
    })
  }

  return pages
}

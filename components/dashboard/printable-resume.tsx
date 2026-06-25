import type { AlignmentResult } from "@/lib/types"

const NAVY = "#0a3061"
const ROYAL = "#4169e1"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: NAVY,
        borderBottom: `1px solid ${NAVY}`,
        paddingBottom: "2px",
        marginTop: "12px",
        marginBottom: "6px",
      }}
    >
      {children}
    </div>
  )
}

/**
 * Off-screen, ATS-styled resume that mirrors the user's LaTeX template.
 * It is rendered in the DOM (not display:none) but pushed off-screen so
 * html2canvas can rasterize it for the PDF export. No personal details.
 */
export function PrintableResume({ result }: { result: AlignmentResult }) {
  const { resume } = result

  // Split core skills into two readable categories for the skills block.
  const half = Math.ceil(resume.coreSkills.length / 2)
  const primarySkills = resume.coreSkills.slice(0, half)
  const secondarySkills = resume.coreSkills.slice(half)

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "794px", // ~ A4 width at 96dpi
      }}
    >
      <div
        id="resume-print"
        style={{
          width: "794px",
          minHeight: "1123px",
          backgroundColor: "#ffffff",
          color: "#111827",
          fontFamily: "var(--font-rubik), ui-sans-serif, system-ui, sans-serif",
          fontSize: "12px",
          lineHeight: 1.4,
          padding: "48px 56px",
          boxSizing: "border-box",
        }}
      >
        {/* Heading — name only, no personal details */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: NAVY,
            }}
          >
            {resume.name}
          </div>
          {resume.headline ? (
            <div style={{ fontSize: "12px", color: ROYAL, marginTop: "3px" }}>
              {resume.headline}
            </div>
          ) : null}
        </div>

        {/* Professional Summary */}
        <SectionHeader>Professional Summary</SectionHeader>
        <div style={{ fontSize: "11.5px", textAlign: "justify" }}>{resume.summary}</div>

        {/* Technical Skills */}
        <SectionHeader>Technical Skills</SectionHeader>
        <div style={{ fontSize: "11.5px" }}>
          {primarySkills.length > 0 && (
            <div style={{ marginBottom: "2px" }}>
              <strong style={{ color: NAVY }}>Core Competencies:</strong> {primarySkills.join(", ")}
            </div>
          )}
          {secondarySkills.length > 0 && (
            <div>
              <strong style={{ color: NAVY }}>Supporting Skills:</strong> {secondarySkills.join(", ")}
            </div>
          )}
        </div>

        {/* Professional Experience */}
        <SectionHeader>Professional Experience</SectionHeader>
        {resume.experiences.map((exp, idx) => (
          <div key={idx} style={{ marginBottom: idx === resume.experiences.length - 1 ? 0 : "10px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontWeight: 700, fontSize: "12.5px", color: "#111827" }}>
                {exp.company}
              </span>
              <span style={{ fontWeight: 700, fontSize: "11px" }}>{exp.period}</span>
            </div>
            <div style={{ fontStyle: "italic", fontSize: "11.5px", color: "#374151" }}>
              {exp.role}
            </div>
            <ul style={{ margin: "4px 0 0", paddingLeft: "16px" }}>
              {exp.bullets.map((bullet, bidx) => (
                <li
                  key={bidx}
                  style={{
                    fontSize: "11.5px",
                    lineHeight: 1.4,
                    marginBottom: "2px",
                    color: bullet.emphasized ? ROYAL : "#1f2937",
                    fontWeight: bullet.emphasized ? 600 : 400,
                  }}
                >
                  {bullet.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

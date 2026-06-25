import type { AlignmentResult } from "@/lib/types"

export function PrintableResume({ result }: { result: AlignmentResult }) {
  const { resume } = result

  return (
    <div
      id="resume-print"
      className="hidden print:block w-full bg-white"
      style={{
        fontSize: "10px",
        lineHeight: "1.3",
        padding: "0.4in",
        fontFamily: "'Fira Code', monospace",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "0.15in" }}>
        <div style={{ fontSize: "16px", fontWeight: "bold", color: "#0a3061" }}>
          {resume.name}
        </div>
        <div style={{ fontSize: "9px", marginTop: "2px" }}>
          City, State | (555) 000-0000 | email@example.com | linkedin.com/in/user | github.com/user
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: "0.1in" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            color: "#0a3061",
            borderBottom: "1px solid #0a3061",
            paddingBottom: "2px",
            marginBottom: "4px",
          }}
        >
          PROFESSIONAL SUMMARY
        </div>
        <div style={{ fontSize: "9px", lineHeight: "1.4" }}>
          {resume.summary}
        </div>
      </div>

      {/* Skills */}
      <div style={{ marginBottom: "0.1in" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            color: "#0a3061",
            borderBottom: "1px solid #0a3061",
            paddingBottom: "2px",
            marginBottom: "4px",
          }}
        >
          TECHNICAL SKILLS
        </div>
        <div style={{ fontSize: "9px", lineHeight: "1.5" }}>
          <strong>Languages & Frameworks:</strong> {resume.coreSkills.slice(0, 4).join(", ")}
          <br />
          <strong>Tools & Technologies:</strong> {resume.coreSkills.slice(4, 8).join(", ")}
        </div>
      </div>

      {/* Experience */}
      <div style={{ marginBottom: "0.1in" }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: "bold",
            color: "#0a3061",
            borderBottom: "1px solid #0a3061",
            paddingBottom: "2px",
            marginBottom: "4px",
          }}
        >
          PROFESSIONAL EXPERIENCE
        </div>
        <div>
          {resume.experiences.map((exp, idx) => (
            <div key={idx} style={{ marginBottom: "0.08in" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                <span>{exp.role}</span>
                <span>{exp.period}</span>
              </div>
              <div style={{ fontSize: "9px", fontStyle: "italic", marginBottom: "2px" }}>
                {exp.company}
              </div>
              <ul style={{ margin: "2px 0", paddingLeft: "12px" }}>
                {exp.bullets.map((bullet, bidx) => (
                  <li
                    key={bidx}
                    style={{
                      fontSize: "9px",
                      lineHeight: "1.3",
                      marginBottom: "1px",
                      fontWeight: bullet.emphasized ? "bold" : "normal",
                      color: bullet.emphasized ? "#4169e1" : "inherit",
                    }}
                  >
                    {bullet.text}
                    {bullet.emphasized && (
                      <span style={{ fontSize: "7px", marginLeft: "4px" }}>[JD MATCH]</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

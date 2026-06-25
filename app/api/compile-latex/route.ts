import { NextResponse } from "next/server"

// Full TeX Live compile service operated by the LaTeX project.
const TEXLIVE_ENDPOINT = "https://texlive.net/cgi-bin/latexcgi"

// Allow time for cold compiles; keep within platform limits.
export const maxDuration = 60

/**
 * Compile a LaTeX document into a real PDF using a full TeX Live backend.
 *
 * The browser sends the generated .tex source here; we proxy to texlive.net
 * (server-side, avoiding CORS) and stream the resulting PDF back. On any
 * compile error we return the log so the client can fall back to jsPDF.
 */
export async function POST(req: Request) {
  let tex: string
  try {
    const body = await req.json()
    tex = typeof body?.tex === "string" ? body.tex : ""
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!tex || tex.length < 40) {
    return NextResponse.json({ error: "Missing LaTeX source" }, { status: 400 })
  }

  const form = new FormData()
  form.append("filename[]", "document.tex")
  form.append("filecontents[]", tex)
  form.append("engine", "pdflatex")
  form.append("return", "pdf")

  let upstream: Response
  try {
    upstream = await fetch(TEXLIVE_ENDPOINT, {
      method: "POST",
      body: form,
      redirect: "follow",
    })
  } catch (error) {
    console.log("[v0] texlive.net request failed:", error)
    return NextResponse.json({ error: "LaTeX service unreachable" }, { status: 502 })
  }

  const contentType = upstream.headers.get("content-type") || ""

  // A successful compile returns a PDF; errors return a text/html log.
  if (!upstream.ok || !contentType.includes("pdf")) {
    const log = await upstream.text().catch(() => "")
    console.log("[v0] LaTeX compile error log (truncated):", log.slice(0, 500))
    return new NextResponse(log || "LaTeX compilation failed", {
      status: 422,
      headers: { "Content-Type": "text/plain" },
    })
  }

  const pdf = await upstream.arrayBuffer()
  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
      "Cache-Control": "no-store",
    },
  })
}

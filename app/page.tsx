import Link from "next/link"
import {
  Network,
  ArrowUpRight,
  ClipboardPaste,
  ScanSearch,
  FileText,
} from "lucide-react"
import { AlignmentDashboard } from "@/components/dashboard/alignment-dashboard"

const steps = [
  {
    icon: Network,
    title: "Build your graph",
    desc: "Capture skills, roles, projects, and metrics once.",
  },
  {
    icon: ClipboardPaste,
    title: "Paste a target role",
    desc: "Drop in any job description you're aiming for.",
  },
  {
    icon: ScanSearch,
    title: "See the alignment",
    desc: "Vector matching scores fit and surfaces gaps.",
  },
  {
    icon: FileText,
    title: "Export a resume",
    desc: "Get a tailored, LaTeX-quality PDF instantly.",
  },
]

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="eyebrow inline-flex items-center gap-2 text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
            Alignment Studio
          </span>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.04] tracking-tight text-foreground sm:text-[3.25rem]">
            Align your career to any role
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
            Paste a target job description and the engine compares it against your
            career graph, generating a tailored resume and surfacing the semantic
            skill gaps standing between you and the role.
          </p>
        </div>

        <Link
          href="/career-graph"
          className="group inline-flex items-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 lg:self-auto"
        >
          <Network className="h-4 w-4" aria-hidden="true" />
          Edit Career Graph
          <ArrowUpRight
            className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </Link>
      </section>

      {/* How it works — guided band */}
      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40"
          >
            <span className="eyebrow text-muted-foreground/70">
              Step {String(i + 1).padStart(2, "0")}
            </span>
            <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-accent ring-1 ring-inset ring-border transition group-hover:bg-accent group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-display text-[15px] font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </div>
        ))}
      </section>

      {/* Workspace */}
      <section className="mt-12 border-t border-border pt-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow text-muted-foreground">Workspace</span>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground">
              Run an alignment
            </h2>
          </div>
        </div>
        <AlignmentDashboard />
      </section>
    </main>
  )
}

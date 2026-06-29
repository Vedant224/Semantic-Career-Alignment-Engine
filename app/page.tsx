import Link from "next/link"
import { Network, ArrowUpRight } from "lucide-react"
import { AlignmentDashboard } from "@/components/dashboard/alignment-dashboard"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Vector-powered alignment
          </span>
          <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            Align your career to any role
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            Paste a target job description and the engine compares it against your
            Master Career Graph, generating a tailored resume and surfacing the
            semantic skill gaps standing between you and the role.
          </p>
        </div>
        <Link
          href="/career-graph"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:text-primary"
        >
          <Network className="h-4 w-4" aria-hidden="true" />
          Edit Career Graph
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <AlignmentDashboard />
    </main>
  )
}

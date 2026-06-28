import Link from "next/link"
import { Network, ArrowUpRight } from "lucide-react"
import { AlignmentDashboard } from "@/components/dashboard/alignment-dashboard"

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            Align your career to any role
          </h1>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Paste a target job description and the engine compares it against your
            career graph, generating a tailored resume and surfacing the semantic
            skill gaps standing between you and the role.
          </p>
        </div>
        <Link
          href="/career-graph"
          className="inline-flex items-center gap-2 self-start rounded-md border border-input bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
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

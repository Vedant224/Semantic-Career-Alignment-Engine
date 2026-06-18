import { fetchCareerGraph } from "@/app/actions"
import { CareerGraphForm } from "@/components/career-graph/career-graph-form"

export default async function CareerGraphPage() {
  const graph = await fetchCareerGraph()

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Master Career Graph
        </span>
        <h1 className="mt-4 text-balance font-serif text-4xl font-medium leading-tight tracking-tight text-foreground">
          The single source of truth for your career
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
          Capture every experience, skill, and metric in a structured form. Each
          entry is embedded and compared against target roles to power resume
          generation and semantic gap analysis.
        </p>
      </div>

      <CareerGraphForm initialGraph={graph} />
    </main>
  )
}

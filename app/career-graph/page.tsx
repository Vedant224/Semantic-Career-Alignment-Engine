import { fetchCareerGraph } from "@/app/actions"
import { CareerGraphForm } from "@/components/career-graph/career-graph-form"

export default async function CareerGraphPage() {
  const graph = await fetchCareerGraph()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl border-b border-border pb-8">
        <h1 className="text-balance text-4xl font-medium leading-tight tracking-tight text-foreground">
          The single source of truth for your career
        </h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
          Capture every experience, skill, and metric in one structured place.
          Each entry is embedded and compared against target roles to power resume
          generation and semantic gap analysis.
        </p>
      </div>

      <CareerGraphForm initialGraph={graph} />
    </main>
  )
}

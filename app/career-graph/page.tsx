import { CareerGraphForm } from "@/components/career-graph/career-graph-form"

export default function CareerGraphPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-2xl border-b border-border pb-9">
        <span className="eyebrow inline-flex items-center gap-2 text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Career Graph
        </span>
        <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground">
          The single source of truth for your career
        </h1>
        <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Capture every experience, skill, and metric in one structured place.
          Each entry is embedded and compared against target roles to power resume
          generation and semantic gap analysis.
        </p>
      </div>

      <CareerGraphForm />
    </main>
  )
}

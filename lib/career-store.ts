import type { CareerGraph } from "./types"

/**
 * In-memory career graph store.
 *
 * This is intentionally simple so the app is fully functional today. When the
 * Aurora PostgreSQL + pgvector integration is connected at the end of the
 * project, the read/write functions below are replaced with parameterized
 * queries against the `career_profiles`, `experiences`, and `skills` tables
 * (schema lives in scripts/001-setup-career-graph-schema.sql).
 */

const seedGraph: CareerGraph = {
  profileName: "Alex Rivera",
  headline: "Senior Full-Stack Engineer",
  summary:
    "Full-stack engineer with 8 years building data-intensive web products. Comfortable owning features end to end, from Postgres schema design to polished React interfaces.",
  experiences: [
    {
      id: "exp-1",
      role: "Senior Software Engineer",
      company: "Northwind Labs",
      startDate: "2021",
      endDate: "Present",
      description:
        "Led the rebuild of the analytics platform using Next.js and Node.js. Designed PostgreSQL schemas powering real-time dashboards. Introduced semantic search with embeddings to improve content discovery. Mentored four engineers across the team.",
      skills: ["Next.js", "Node.js", "PostgreSQL", "Embeddings"],
      metrics: [
        { id: "m-1", label: "Search relevance lift", value: "+38%" },
        { id: "m-2", label: "Dashboard load time", value: "-62%" },
      ],
    },
    {
      id: "exp-2",
      role: "Software Engineer",
      company: "Brightside",
      startDate: "2018",
      endDate: "2021",
      description:
        "Built REST APIs and React frontends for a fintech product. Shipped CI/CD pipelines on AWS and improved test coverage. Collaborated with product on roadmapping and A/B testing.",
      skills: ["React", "REST APIs", "AWS", "CI/CD"],
      metrics: [{ id: "m-3", label: "Deploy frequency", value: "3x weekly" }],
    },
  ],
  skills: [
    { id: "s-1", name: "TypeScript", level: "Expert", years: 7 },
    { id: "s-2", name: "React", level: "Expert", years: 7 },
    { id: "s-3", name: "Next.js", level: "Advanced", years: 5 },
    { id: "s-4", name: "Node.js", level: "Advanced", years: 6 },
    { id: "s-5", name: "PostgreSQL", level: "Advanced", years: 6 },
    { id: "s-6", name: "AWS", level: "Intermediate", years: 4 },
    { id: "s-7", name: "Embeddings", level: "Intermediate", years: 2 },
  ],
}

// Module-level mutable copy (swap for DB rows later).
let currentGraph: CareerGraph = structuredClone(seedGraph)

export async function getCareerGraph(): Promise<CareerGraph> {
  return structuredClone(currentGraph)
}

export async function saveCareerGraph(graph: CareerGraph): Promise<CareerGraph> {
  currentGraph = structuredClone(graph)
  return structuredClone(currentGraph)
}

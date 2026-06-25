import type { CareerGraph } from "./types"

/**
 * In-memory career graph store.
 *
 * This is intentionally simple so the app is fully functional today. When the
 * Aurora PostgreSQL + pgvector integration is connected at the end of the
 * project, the read/write functions below are replaced with parameterized
 * queries against the `career_profiles`, `experiences`, `skills`, `projects`,
 * `education`, and `certifications` tables
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
      location: "Remote",
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
      location: "Austin, TX",
      startDate: "2018",
      endDate: "2021",
      description:
        "Built REST APIs and React frontends for a fintech product. Shipped CI/CD pipelines on AWS and improved test coverage. Collaborated with product on roadmapping and A/B testing.",
      skills: ["React", "REST APIs", "AWS", "CI/CD"],
      metrics: [{ id: "m-3", label: "Deploy frequency", value: "3x weekly" }],
    },
  ],
  skills: [
    { id: "s-1", name: "TypeScript", level: "Expert", years: 7, category: "Languages" },
    { id: "s-2", name: "JavaScript", level: "Expert", years: 8, category: "Languages" },
    { id: "s-3", name: "Python", level: "Intermediate", years: 4, category: "Languages" },
    { id: "s-4", name: "React", level: "Expert", years: 7, category: "Frontend" },
    { id: "s-5", name: "Next.js", level: "Advanced", years: 5, category: "Frontend" },
    { id: "s-6", name: "Tailwind CSS", level: "Advanced", years: 4, category: "Frontend" },
    { id: "s-7", name: "Node.js", level: "Advanced", years: 6, category: "Backend" },
    { id: "s-8", name: "REST APIs", level: "Advanced", years: 6, category: "Backend" },
    { id: "s-9", name: "GraphQL", level: "Intermediate", years: 3, category: "Backend" },
    { id: "s-10", name: "PostgreSQL", level: "Advanced", years: 6, category: "Databases" },
    { id: "s-11", name: "Redis", level: "Intermediate", years: 3, category: "Databases" },
    { id: "s-12", name: "pgvector", level: "Intermediate", years: 2, category: "Databases" },
    { id: "s-13", name: "AWS", level: "Intermediate", years: 4, category: "DevOps & Tools" },
    { id: "s-14", name: "Docker", level: "Advanced", years: 5, category: "DevOps & Tools" },
    { id: "s-15", name: "CI/CD", level: "Advanced", years: 5, category: "DevOps & Tools" },
    { id: "s-16", name: "System Design", level: "Advanced", years: 5, category: "Core Skills" },
    { id: "s-17", name: "Embeddings", level: "Intermediate", years: 2, category: "Core Skills" },
    { id: "s-18", name: "Microservices", level: "Advanced", years: 4, category: "Core Skills" },
  ],
  projects: [
    {
      id: "proj-1",
      name: "Semantic Search Platform",
      link: "https://github.com/example/semantic-search",
      techStack: "Next.js, PostgreSQL, pgvector, OpenAI",
      highlight: "Internal tool adopted by 5 product teams",
      description:
        "Built a vector search service indexing 2M+ documents with pgvector and HNSW indexes. Designed a hybrid ranking layer combining BM25 and cosine similarity. Reduced median query latency to under 80ms at p95.",
    },
    {
      id: "proj-2",
      name: "Realtime Analytics Dashboard",
      link: "https://github.com/example/analytics",
      techStack: "React, Node.js, WebSockets, Redis",
      highlight: "",
      description:
        "Engineered a streaming dashboard handling 10k events/sec using WebSockets and Redis pub/sub. Implemented incremental aggregation to keep charts under one-second freshness.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "University of Washington",
      degree: "B.S. in Computer Science",
      location: "Seattle, WA",
      startDate: "2014",
      endDate: "2018",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      link: "",
    },
    {
      id: "cert-2",
      name: "Professional Scrum Master I (PSM I)",
      issuer: "Scrum.org",
      link: "",
    },
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

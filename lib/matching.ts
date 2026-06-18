import type {
  AlignmentResult,
  AlignmentStatus,
  CareerGraph,
  ResumeExperience,
  SkillAlignment,
} from "./types"

/**
 * Lightweight semantic matcher.
 *
 * This is a deterministic, dependency-free stand-in for the real engine.
 * When the Aurora PostgreSQL + pgvector layer is wired up at the end of the
 * project, `embeddingSimilarity` below is replaced by a cosine-distance query
 * against stored skill/experience embeddings (see lib/db.ts and scripts/).
 */

// Curated vocabulary used to pull recognizable skills out of free-form text.
const SKILL_VOCABULARY = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "SQL",
  "React", "Next.js", "Vue", "Svelte", "Node.js", "GraphQL", "REST APIs",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "pgvector", "Kafka",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD",
  "Machine Learning", "Deep Learning", "LLMs", "NLP", "Data Pipelines",
  "Vector Search", "Embeddings", "Distributed Systems", "Microservices",
  "System Design", "Product Strategy", "Roadmapping", "Stakeholder Management",
  "Agile", "Scrum", "Leadership", "Mentorship", "A/B Testing", "Analytics",
  "Figma", "Design Systems", "Accessibility", "Performance Optimization",
  "Tailwind CSS", "Observability", "Security", "Authentication",
]

// Synonym clusters give the matcher a "semantic" sense of nearness.
const SYNONYMS: Record<string, string[]> = {
  "react": ["next.js", "frontend", "jsx", "spa"],
  "next.js": ["react", "ssr", "app router", "frontend"],
  "node.js": ["backend", "express", "server-side javascript"],
  "postgresql": ["sql", "rdbms", "relational database", "aurora"],
  "pgvector": ["vector search", "embeddings", "semantic search", "ann"],
  "vector search": ["pgvector", "embeddings", "semantic search"],
  "llms": ["nlp", "machine learning", "generative ai", "transformers"],
  "machine learning": ["deep learning", "llms", "nlp", "ml"],
  "aws": ["cloud", "gcp", "azure", "infrastructure"],
  "kubernetes": ["docker", "containers", "orchestration", "devops"],
  "ci/cd": ["devops", "github actions", "automation", "pipelines"],
  "leadership": ["mentorship", "management", "stakeholder management"],
  "system design": ["distributed systems", "architecture", "microservices"],
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s]/g, " ").replace(/\s+/g, " ").trim()
}

function tokenize(text: string): Set<string> {
  return new Set(normalize(text).split(" ").filter((t) => t.length > 1))
}

/** Extract recognizable skills/requirements from a raw job description. */
export function extractJobSkills(jobDescription: string): string[] {
  const lower = normalize(jobDescription)
  const found = new Set<string>()

  for (const skill of SKILL_VOCABULARY) {
    if (lower.includes(normalize(skill))) {
      found.add(skill)
    }
  }

  // Capture "X years of Y" and bullet-style requirements heuristically.
  const phraseHits = lower.match(/(?:experience (?:with|in)|proficient in|knowledge of)\s+([a-z0-9+#. ]{3,30})/g)
  if (phraseHits) {
    for (const hit of phraseHits) {
      const phrase = hit.replace(/(experience (with|in)|proficient in|knowledge of)/, "").trim()
      const match = SKILL_VOCABULARY.find((s) => normalize(s) === phrase)
      if (match) found.add(match)
    }
  }

  return Array.from(found)
}

/** Placeholder similarity. Swap with pgvector cosine similarity later. */
function embeddingSimilarity(jobSkill: string, graphSkill: string): number {
  const a = normalize(jobSkill)
  const b = normalize(graphSkill)
  if (a === b) return 1

  const aTokens = tokenize(jobSkill)
  const bTokens = tokenize(graphSkill)
  let overlap = 0
  for (const t of aTokens) if (bTokens.has(t)) overlap++
  const jaccard = overlap / new Set([...aTokens, ...bTokens]).size

  const aSyn = SYNONYMS[a] ?? []
  const bSyn = SYNONYMS[b] ?? []
  const synHit = aSyn.includes(b) || bSyn.includes(a) ? 0.7 : 0
  const partialHit = a.includes(b) || b.includes(a) ? 0.55 : 0

  return Math.min(1, Math.max(jaccard, synHit, partialHit))
}

function statusFor(similarity: number): AlignmentStatus {
  if (similarity >= 0.85) return "match"
  if (similarity >= 0.45) return "partial"
  return "gap"
}

/** Compare the career graph against the extracted job skills. */
export function alignGraph(graph: CareerGraph, jobSkills: string[]): SkillAlignment[] {
  const graphSkillNames = graph.skills.map((s) => s.name)

  return jobSkills.map((jobSkill) => {
    let best = 0
    let evidence: string | undefined

    for (const gs of graphSkillNames) {
      const sim = embeddingSimilarity(jobSkill, gs)
      if (sim > best) {
        best = sim
        evidence = gs
      }
    }

    // Also look for evidence inside experience descriptions.
    for (const exp of graph.experiences) {
      const sim = embeddingSimilarity(jobSkill, exp.description)
      if (sim > best) {
        best = Math.max(best, Math.min(sim + 0.1, 0.84))
        evidence = `${exp.role} @ ${exp.company}`
      }
    }

    const status = statusFor(best)
    return {
      skill: jobSkill,
      status,
      similarity: Number(best.toFixed(2)),
      evidence: status === "gap" ? undefined : evidence,
    }
  })
}

function buildResume(
  graph: CareerGraph,
  jobSkills: string[],
  alignments: SkillAlignment[],
): AlignmentResult["resume"] {
  const matchedSkillNames = new Set(
    alignments.filter((a) => a.status !== "gap").map((a) => a.evidence ?? ""),
  )
  const jobSkillLower = jobSkills.map((s) => normalize(s))

  // Sort core skills so JD-relevant ones surface first.
  const coreSkills = [...graph.skills]
    .sort((a, b) => {
      const aRel = jobSkillLower.some((j) => embeddingSimilarity(j, a.name) >= 0.45) ? 1 : 0
      const bRel = jobSkillLower.some((j) => embeddingSimilarity(j, b.name) >= 0.45) ? 1 : 0
      if (aRel !== bRel) return bRel - aRel
      return b.years - a.years
    })
    .map((s) => s.name)

  const experiences: ResumeExperience[] = [...graph.experiences]
    .sort((a, b) => (b.endDate || "9999").localeCompare(a.endDate || "9999"))
    .map((exp) => {
      const bullets = buildBullets(exp, jobSkillLower)
      return {
        role: exp.role,
        company: exp.company,
        period: `${exp.startDate || "—"} – ${exp.endDate || "Present"}`,
        bullets,
      }
    })

  const topJobSkills = jobSkills.slice(0, 4).join(", ")
  const summary = topJobSkills
    ? `${graph.summary} Specializing in ${topJobSkills} with a track record matched to this role.`
    : graph.summary

  return {
    name: graph.profileName,
    headline: graph.headline,
    summary,
    coreSkills,
    experiences,
  }

  function buildBullets(exp: (typeof graph.experiences)[number], jobLower: string[]) {
    const bullets: { text: string; emphasized: boolean }[] = []
    const sentences = exp.description
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean)

    for (const sentence of sentences.length ? sentences : [exp.description]) {
      const emphasized = jobLower.some((j) => embeddingSimilarity(j, sentence) >= 0.4)
      if (sentence) bullets.push({ text: sentence, emphasized })
    }

    for (const metric of exp.metrics) {
      bullets.push({
        text: `${metric.label}: ${metric.value}`,
        emphasized: true,
      })
    }

    // Emphasized bullets float to the top.
    return bullets.sort((a, b) => Number(b.emphasized) - Number(a.emphasized))
  }
}

/** Full alignment pass: extract, compare, score, and generate a resume. */
export function runAlignment(graph: CareerGraph, jobDescription: string): AlignmentResult {
  const jobSkills = extractJobSkills(jobDescription)
  const alignments = alignGraph(graph, jobSkills)

  const matched = alignments.filter((a) => a.status === "match")
  const partial = alignments.filter((a) => a.status === "partial")
  const gaps = alignments.filter((a) => a.status === "gap")

  const score = jobSkills.length
    ? Math.round(
        ((matched.length + partial.length * 0.5) / jobSkills.length) * 100,
      )
    : 0

  return {
    score,
    matched,
    partial,
    gaps,
    jobSkills,
    resume: buildResume(graph, jobSkills, alignments),
  }
}

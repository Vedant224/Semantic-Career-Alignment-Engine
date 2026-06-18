// Domain types for the Semantic Career Alignment Engine.
// These map 1:1 to the planned Aurora PostgreSQL schema (see scripts/).

export interface Skill {
  id: string
  name: string
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  years: number
}

export interface Metric {
  id: string
  label: string
  value: string
}

export interface Experience {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string
  description: string
  skills: string[]
  metrics: Metric[]
}

export interface CareerGraph {
  profileName: string
  headline: string
  summary: string
  experiences: Experience[]
  skills: Skill[]
}

export type AlignmentStatus = "match" | "partial" | "gap"

export interface SkillAlignment {
  skill: string
  status: AlignmentStatus
  // Cosine similarity placeholder (0-1). Will be backed by pgvector at the end.
  similarity: number
  evidence?: string
}

export interface ResumeBullet {
  text: string
  emphasized: boolean
}

export interface ResumeExperience {
  role: string
  company: string
  period: string
  bullets: ResumeBullet[]
}

export interface AlignmentResult {
  score: number
  matched: SkillAlignment[]
  partial: SkillAlignment[]
  gaps: SkillAlignment[]
  jobSkills: string[]
  resume: {
    name: string
    headline: string
    summary: string
    coreSkills: string[]
    experiences: ResumeExperience[]
  }
}

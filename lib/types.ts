// Domain types for the Semantic Career Alignment Engine.
// These map 1:1 to the planned Aurora PostgreSQL schema (see scripts/).

export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Backend"
  | "Databases"
  | "DevOps & Tools"
  | "Core Skills"

export const SKILL_CATEGORIES: SkillCategory[] = [
  "Languages",
  "Frontend",
  "Backend",
  "Databases",
  "DevOps & Tools",
  "Core Skills",
]

export interface Skill {
  id: string
  name: string
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  years: number
  category: SkillCategory
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
  location: string
  startDate: string
  endDate: string
  description: string
  skills: string[]
  metrics: Metric[]
}

export interface Project {
  id: string
  name: string
  link: string
  techStack: string
  // Optional one-line highlight (e.g. award, ranking, context).
  highlight: string
  description: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  location: string
  startDate: string
  endDate: string
}

export interface Certification {
  id: string
  name: string
  issuer: string
  link: string
}

export interface Contact {
  email: string
  phone: string
  location: string
  website: string
  github: string
  linkedin: string
}

export interface CareerGraph {
  profileName: string
  headline: string
  contact: Contact
  experiences: Experience[]
  skills: Skill[]
  projects: Project[]
  education: Education[]
  certifications: Certification[]
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
  location: string
  period: string
  bullets: ResumeBullet[]
}

export interface ResumeProject {
  name: string
  link: string
  techStack: string
  highlight: string
  bullets: ResumeBullet[]
}

export interface ResumeEducation {
  institution: string
  degree: string
  location: string
  period: string
}

export interface ResumeCertification {
  name: string
  issuer: string
  link: string
}

export interface ResumeSkillGroup {
  label: string
  items: string[]
}

export interface GeneratedResume {
  name: string
  headline: string
  contact: Contact
  skillGroups: ResumeSkillGroup[]
  experiences: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
  certifications: ResumeCertification[]
}

export interface AlignmentResult {
  score: number
  matched: SkillAlignment[]
  partial: SkillAlignment[]
  gaps: SkillAlignment[]
  jobSkills: string[]
  resume: GeneratedResume
  /** Which pipeline produced this result */
  pipeline?: "vector-engine" | "fallback"
}

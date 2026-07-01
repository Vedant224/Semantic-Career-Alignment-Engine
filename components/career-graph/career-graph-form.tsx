"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  Plus,
  Trash2,
  Save,
  Check,
  ChevronDown,
  Loader2,
  Briefcase,
  Wrench,
  BarChart3,
  User,
  FolderGit2,
  GraduationCap,
  Award,
  Contact as ContactIcon,
} from "lucide-react"
import { updateCareerGraph } from "@/app/actions"
import type {
  CareerGraph,
  Certification,
  Education,
  Experience,
  Project,
  Skill,
  SkillCategory,
} from "@/lib/types"
import { SKILL_CATEGORIES } from "@/lib/types"
import { cn } from "@/lib/utils"

const LEVELS: Skill["level"][] = ["Beginner", "Intermediate", "Advanced", "Expert"]

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function CareerGraphForm({ initialGraph }: { initialGraph: CareerGraph }) {
  const [graph, setGraph] = useState<CareerGraph>(initialGraph)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  function update(patch: Partial<CareerGraph>) {
    setGraph((g) => ({ ...g, ...patch }))
    setSaved(false)
  }

  function updateContact(patch: Partial<CareerGraph["contact"]>) {
    setGraph((g) => ({ ...g, contact: { ...g.contact, ...patch } }))
    setSaved(false)
  }

  function save() {
    startTransition(async () => {
      await updateCareerGraph(graph)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  // ----- Skills -----
  function addSkill() {
    update({
      skills: [
        ...graph.skills,
        { id: uid("s"), name: "", level: "Intermediate", years: 1, category: "Languages" },
      ],
    })
  }
  function updateSkill(id: string, patch: Partial<Skill>) {
    update({ skills: graph.skills.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  }
  function removeSkill(id: string) {
    update({ skills: graph.skills.filter((s) => s.id !== id) })
  }

  // ----- Experiences -----
  function addExperience() {
    update({
      experiences: [
        ...graph.experiences,
        {
          id: uid("exp"),
          role: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
          skills: [],
          metrics: [],
        },
      ],
    })
  }
  function updateExperience(id: string, patch: Partial<Experience>) {
    update({
      experiences: graph.experiences.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  }
  function removeExperience(id: string) {
    update({ experiences: graph.experiences.filter((e) => e.id !== id) })
  }
  function addMetric(expId: string) {
    update({
      experiences: graph.experiences.map((e) =>
        e.id === expId
          ? { ...e, metrics: [...e.metrics, { id: uid("m"), label: "", value: "" }] }
          : e,
      ),
    })
  }
  function updateMetric(expId: string, metricId: string, patch: { label?: string; value?: string }) {
    update({
      experiences: graph.experiences.map((e) =>
        e.id === expId
          ? { ...e, metrics: e.metrics.map((m) => (m.id === metricId ? { ...m, ...patch } : m)) }
          : e,
      ),
    })
  }
  function removeMetric(expId: string, metricId: string) {
    update({
      experiences: graph.experiences.map((e) =>
        e.id === expId ? { ...e, metrics: e.metrics.filter((m) => m.id !== metricId) } : e,
      ),
    })
  }

  // ----- Projects -----
  function addProject() {
    update({
      projects: [
        ...graph.projects,
        { id: uid("proj"), name: "", link: "", techStack: "", highlight: "", description: "" },
      ],
    })
  }
  function updateProject(id: string, patch: Partial<Project>) {
    update({ projects: graph.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  function removeProject(id: string) {
    update({ projects: graph.projects.filter((p) => p.id !== id) })
  }

  // ----- Education -----
  function addEducation() {
    update({
      education: [
        ...graph.education,
        { id: uid("edu"), institution: "", degree: "", location: "", startDate: "", endDate: "" },
      ],
    })
  }
  function updateEducation(id: string, patch: Partial<Education>) {
    update({ education: graph.education.map((e) => (e.id === id ? { ...e, ...patch } : e)) })
  }
  function removeEducation(id: string) {
    update({ education: graph.education.filter((e) => e.id !== id) })
  }

  // ----- Certifications -----
  function addCertification() {
    update({
      certifications: [
        ...graph.certifications,
        { id: uid("cert"), name: "", issuer: "", link: "" },
      ],
    })
  }
  function updateCertification(id: string, patch: Partial<Certification>) {
    update({
      certifications: graph.certifications.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  }
  function removeCertification(id: string) {
    update({ certifications: graph.certifications.filter((c) => c.id !== id) })
  }

  return (
    <div className="lg:grid lg:grid-cols-[180px_1fr] lg:items-start lg:gap-8">
      <SectionNav />

      <div className="space-y-8">
      {/* Profile */}
      <Card id="profile" icon={User} title="Profile" subtitle="The headline that anchors your generated resume">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input
              value={graph.profileName}
              onChange={(v) => update({ profileName: v })}
              placeholder="Alex Rivera"
            />
          </Field>
          <Field label="Headline">
            <Input
              value={graph.headline}
              onChange={(v) => update({ headline: v })}
              placeholder="Senior Full-Stack Engineer"
            />
          </Field>
        </div>
      </Card>

      {/* Contact & Links */}
      <Card
        id="contact"
        icon={ContactIcon}
        title="Contact & Links"
        subtitle="These appear under your name in the resume header"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input
              value={graph.contact.email}
              onChange={(v) => updateContact({ email: v })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={graph.contact.phone}
              onChange={(v) => updateContact({ phone: v })}
              placeholder="+1 (555) 123-4567"
            />
          </Field>
          <Field label="Location">
            <Input
              value={graph.contact.location}
              onChange={(v) => updateContact({ location: v })}
              placeholder="Seattle, WA"
            />
          </Field>
          <Field label="Personal website">
            <Input
              value={graph.contact.website}
              onChange={(v) => updateContact({ website: v })}
              placeholder="https://yourname.dev"
            />
          </Field>
          <Field label="GitHub">
            <Input
              value={graph.contact.github}
              onChange={(v) => updateContact({ github: v })}
              placeholder="https://github.com/username"
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={graph.contact.linkedin}
              onChange={(v) => updateContact({ linkedin: v })}
              placeholder="https://linkedin.com/in/username"
            />
          </Field>
        </div>
      </Card>

      {/* Skills */}
      <Card
        id="skills"
        icon={Wrench}
        title="Skills"
        subtitle="Categorized skills become nodes in your graph and vectors for matching"
        action={<AddButton label="Add skill" onClick={addSkill} />}
      >
        <div className="space-y-2.5">
          {graph.skills.length === 0 && <Empty>No skills yet. Add your first skill.</Empty>}
          {graph.skills.map((skill) => (
            <div
              key={skill.id}
              className="grid grid-cols-1 gap-2 rounded-lg bg-muted/40 p-2.5 sm:grid-cols-[1fr_auto_auto_auto_auto]"
            >
              <Input
                value={skill.name}
                onChange={(v) => updateSkill(skill.id, { name: v })}
                placeholder="e.g. PostgreSQL"
              />
              <Select
                value={skill.category}
                onChange={(v) => updateSkill(skill.id, { category: v as SkillCategory })}
                options={SKILL_CATEGORIES}
              />
              <Select
                value={skill.level}
                onChange={(v) => updateSkill(skill.id, { level: v as Skill["level"] })}
                options={LEVELS}
              />
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={skill.years}
                  onChange={(e) => updateSkill(skill.id, { years: Number(e.target.value) })}
                  className="w-16 rounded-lg border border-transparent bg-card px-2 py-2 text-sm text-foreground outline-none transition focus:border-ring"
                />
                <span className="text-xs text-muted-foreground">yrs</span>
              </div>
              <IconButton label="Remove skill" onClick={() => removeSkill(skill.id)} />
            </div>
          ))}
        </div>
      </Card>

      {/* Experiences */}
      <Card
        id="experience"
        icon={Briefcase}
        title="Experience"
        subtitle="Roles, responsibilities, and the metrics that prove your impact"
        action={<AddButton label="Add role" onClick={addExperience} />}
      >
        <div className="space-y-4">
          {graph.experiences.length === 0 && <Empty>No experience entries yet.</Empty>}
          {graph.experiences.map((exp) => (
              <div key={exp.id} className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field label="Role">
                    <Input
                      value={exp.role}
                      onChange={(v) => updateExperience(exp.id, { role: v })}
                      placeholder="Senior Software Engineer"
                    />
                  </Field>
                  <Field label="Company">
                    <Input
                      value={exp.company}
                      onChange={(v) => updateExperience(exp.id, { company: v })}
                      placeholder="Northwind Labs"
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={exp.location}
                      onChange={(v) => updateExperience(exp.id, { location: v })}
                      placeholder="Remote"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start">
                      <Input
                        value={exp.startDate}
                        onChange={(v) => updateExperience(exp.id, { startDate: v })}
                        placeholder="2021"
                      />
                    </Field>
                    <Field label="End">
                      <Input
                        value={exp.endDate}
                        onChange={(v) => updateExperience(exp.id, { endDate: v })}
                        placeholder="Present"
                      />
                    </Field>
                  </div>
                </div>
                <IconButton label="Remove role" onClick={() => removeExperience(exp.id)} />
              </div>

              <Field label="Description" className="mt-3">
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Describe what you built and the impact you had. Each sentence becomes a bullet."
                  className={textareaClass}
                />
              </Field>

              <div className="mt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Metrics
                  </span>
                  <button
                    type="button"
                    onClick={() => addMetric(exp.id)}
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    + Add metric
                  </button>
                </div>
                <div className="space-y-2">
                  {exp.metrics.map((metric) => (
                    <div key={metric.id} className="flex items-center gap-2">
                      <Input
                        value={metric.label}
                        onChange={(v) => updateMetric(exp.id, metric.id, { label: v })}
                        placeholder="Metric (e.g. Revenue impact)"
                      />
                      <Input
                        value={metric.value}
                        onChange={(v) => updateMetric(exp.id, metric.id, { value: v })}
                        placeholder="Value (e.g. +38%)"
                      />
                      <IconButton
                        label="Remove metric"
                        onClick={() => removeMetric(exp.id, metric.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Projects */}
      <Card
        id="projects"
        icon={FolderGit2}
        title="Projects"
        subtitle="Standout builds — JD-relevant projects are surfaced first on your resume"
        action={<AddButton label="Add project" onClick={addProject} />}
      >
        <div className="space-y-4">
          {graph.projects.length === 0 && <Empty>No projects yet.</Empty>}
          {graph.projects.map((project) => (
              <div key={project.id} className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field label="Project name">
                    <Input
                      value={project.name}
                      onChange={(v) => updateProject(project.id, { name: v })}
                      placeholder="Semantic Search Platform"
                    />
                  </Field>
                  <Field label="Link (optional)">
                    <Input
                      value={project.link}
                      onChange={(v) => updateProject(project.id, { link: v })}
                      placeholder="https://github.com/you/project"
                    />
                  </Field>
                  <Field label="Tech stack">
                    <Input
                      value={project.techStack}
                      onChange={(v) => updateProject(project.id, { techStack: v })}
                      placeholder="Next.js, PostgreSQL, pgvector"
                    />
                  </Field>
                  <Field label="Highlight (optional)">
                    <Input
                      value={project.highlight}
                      onChange={(v) => updateProject(project.id, { highlight: v })}
                      placeholder="Hackathon finalist, 5 teams adopted, etc."
                    />
                  </Field>
                </div>
                <IconButton label="Remove project" onClick={() => removeProject(project.id)} />
              </div>
              <Field label="Description" className="mt-3">
                <textarea
                  value={project.description}
                  onChange={(e) => updateProject(project.id, { description: e.target.value })}
                  rows={3}
                  placeholder="What you built and the impact. Each sentence becomes a bullet."
                  className={textareaClass}
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      {/* Education */}
      <Card
        id="education"
        icon={GraduationCap}
        title="Education"
        subtitle="Degrees and institutions"
        action={<AddButton label="Add education" onClick={addEducation} />}
      >
        <div className="space-y-4">
          {graph.education.length === 0 && <Empty>No education entries yet.</Empty>}
          {graph.education.map((edu) => (
              <div key={edu.id} className="rounded-xl bg-muted/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Field label="Institution">
                    <Input
                      value={edu.institution}
                      onChange={(v) => updateEducation(edu.id, { institution: v })}
                      placeholder="University of Washington"
                    />
                  </Field>
                  <Field label="Degree">
                    <Input
                      value={edu.degree}
                      onChange={(v) => updateEducation(edu.id, { degree: v })}
                      placeholder="B.S. in Computer Science"
                    />
                  </Field>
                  <Field label="Location">
                    <Input
                      value={edu.location}
                      onChange={(v) => updateEducation(edu.id, { location: v })}
                      placeholder="Seattle, WA"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start">
                      <Input
                        value={edu.startDate}
                        onChange={(v) => updateEducation(edu.id, { startDate: v })}
                        placeholder="2014"
                      />
                    </Field>
                    <Field label="End">
                      <Input
                        value={edu.endDate}
                        onChange={(v) => updateEducation(edu.id, { endDate: v })}
                        placeholder="2018"
                      />
                    </Field>
                  </div>
                </div>
                <IconButton label="Remove education" onClick={() => removeEducation(edu.id)} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Certifications */}
      <Card
        id="certifications"
        icon={Award}
        title="Achievements & Certifications"
        subtitle="Credentials, awards, and recognitions"
        action={<AddButton label="Add certification" onClick={addCertification} />}
      >
        <div className="space-y-2.5">
          {graph.certifications.length === 0 && <Empty>No certifications yet.</Empty>}
          {graph.certifications.map((cert) => (
            <div
              key={cert.id}
              className="grid grid-cols-1 gap-2 rounded-lg bg-muted/40 p-2.5 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
            >
              <Input
                value={cert.name}
                onChange={(v) => updateCertification(cert.id, { name: v })}
                placeholder="AWS Certified Solutions Architect"
              />
              <Input
                value={cert.issuer}
                onChange={(v) => updateCertification(cert.id, { issuer: v })}
                placeholder="Amazon Web Services"
              />
              <Input
                value={cert.link}
                onChange={(v) => updateCertification(cert.id, { link: v })}
                placeholder="Credential URL (optional)"
              />
              <IconButton
                label="Remove certification"
                onClick={() => removeCertification(cert.id)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3.5">
        <p className="text-sm text-muted-foreground">
          {graph.skills.length} skills · {graph.experiences.length} roles · {graph.projects.length}{" "}
          projects
        </p>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground transition",
            saved ? "bg-[color:var(--match)]" : "bg-primary hover:opacity-90",
            "disabled:opacity-60",
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : saved ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {isPending ? "Saving" : saved ? "Saved" : "Save career graph"}
        </button>
      </div>
      </div>
    </div>
  )
}

/* ---------- small primitives ---------- */

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "contact", label: "Contact & Links", icon: ContactIcon },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "projects", label: "Projects", icon: FolderGit2 },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "certifications", label: "Achievements", icon: Award },
] as const

function SectionNav() {
  return (
    <nav
      aria-label="Career graph sections"
      className="mb-6 hidden lg:sticky lg:top-24 lg:mb-0 lg:block"
    >
      <p className="eyebrow mb-3 px-3 text-muted-foreground">Sections</p>
      <ul className="space-y-0.5">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const textareaClass =
  "w-full resize-none rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card"

function Card({
  id,
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  id?: string
  icon: typeof User
  title: string
  subtitle: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-accent ring-1 ring-inset ring-border">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-foreground/70">{label}</span>
      {children}
    </label>
  )
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:bg-card"
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(0, options.indexOf(value)))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    return () => document.removeEventListener("mousedown", onPointer)
  }, [open])

  function commit(option: string) {
    onChange(option)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || (!open && (e.key === "Enter" || e.key === " "))) {
      e.preventDefault()
      if (!open) {
        setOpen(true)
        setActive(Math.max(0, options.indexOf(value)))
      } else {
        setActive((i) => Math.min(options.length - 1, i + 1))
      }
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === "Enter" && open) {
      e.preventDefault()
      commit(options[active])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={ref} className="relative min-w-[9rem] font-sans">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o)
          setActive(Math.max(0, options.indexOf(value)))
        }}
        onKeyDown={onKeyDown}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:bg-card"
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1.5 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg shadow-foreground/5"
        >
          {options.map((o, i) => {
            const selected = o === value
            return (
              <li key={o} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => commit(o)}
                  onMouseEnter={() => setActive(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                    i === active ? "bg-muted text-foreground" : "text-muted-foreground",
                    selected && "font-medium text-foreground",
                  )}
                >
                  <span className="truncate">{o}</span>
                  {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent bg-transparent text-muted-foreground transition hover:bg-[color:var(--gap)]/10 hover:text-[color:var(--gap)]"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border bg-background/50 px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

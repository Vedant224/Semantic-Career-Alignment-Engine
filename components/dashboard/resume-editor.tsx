"use client"

import { Plus, Trash2, X, Highlighter } from "lucide-react"
import type {
  GeneratedResume,
  ResumeBullet,
  ResumeExperience,
  ResumeProject,
  ResumeEducation,
  ResumeCertification,
  ResumeSkillGroup,
  Contact,
} from "@/lib/types"
import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Structured editor for a GeneratedResume. Every edit calls onChange with a
 * fresh object so the parent can recompile the live PDF preview.
 */
export function ResumeEditor({
  resume,
  onChange,
}: {
  resume: GeneratedResume
  onChange: (r: GeneratedResume) => void
}) {
  const set = (patch: Partial<GeneratedResume>) => onChange({ ...resume, ...patch })

  return (
    <div className="space-y-6 p-4 sm:p-5">
      {/* Header */}
      <EditSection title="Header">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <Input value={resume.name} onChange={(v) => set({ name: v })} placeholder="Alex Rivera" />
          </Field>
          <Field label="Headline">
            <Input
              value={resume.headline}
              onChange={(v) => set({ headline: v })}
              placeholder="Senior Full-Stack Engineer"
            />
          </Field>
        </div>
      </EditSection>

      {/* Contact */}
      <EditSection title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["website", "Website"],
              ["github", "GitHub"],
              ["linkedin", "LinkedIn"],
            ] as [keyof Contact, string][]
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <Input
                value={resume.contact?.[key] ?? ""}
                onChange={(v) => set({ contact: { ...resume.contact, [key]: v } })}
                placeholder={label}
              />
            </Field>
          ))}
        </div>
      </EditSection>

      {/* Skills */}
      <EditSection
        title="Skills"
        onAdd={() =>
          set({ skillGroups: [...resume.skillGroups, { label: "New group", items: [] }] })
        }
        addLabel="Add group"
      >
        <div className="space-y-3">
          {resume.skillGroups.map((group, gi) => (
            <SkillGroupEditor
              key={gi}
              group={group}
              onChange={(g) =>
                set({ skillGroups: resume.skillGroups.map((x, i) => (i === gi ? g : x)) })
              }
              onRemove={() =>
                set({ skillGroups: resume.skillGroups.filter((_, i) => i !== gi) })
              }
            />
          ))}
        </div>
      </EditSection>

      {/* Experience */}
      <EditSection
        title="Experience"
        onAdd={() =>
          set({
            experiences: [
              ...resume.experiences,
              { role: "", company: "", location: "", period: "", bullets: [] },
            ],
          })
        }
        addLabel="Add role"
      >
        <div className="space-y-4">
          {resume.experiences.map((exp, ei) => (
            <ExperienceEditor
              key={ei}
              exp={exp}
              onChange={(e) =>
                set({ experiences: resume.experiences.map((x, i) => (i === ei ? e : x)) })
              }
              onRemove={() =>
                set({ experiences: resume.experiences.filter((_, i) => i !== ei) })
              }
            />
          ))}
        </div>
      </EditSection>

      {/* Projects */}
      <EditSection
        title="Projects"
        onAdd={() =>
          set({
            projects: [
              ...resume.projects,
              { name: "", link: "", techStack: "", highlight: "", bullets: [] },
            ],
          })
        }
        addLabel="Add project"
      >
        <div className="space-y-4">
          {resume.projects.map((proj, pi) => (
            <ProjectEditor
              key={pi}
              proj={proj}
              onChange={(p) =>
                set({ projects: resume.projects.map((x, i) => (i === pi ? p : x)) })
              }
              onRemove={() => set({ projects: resume.projects.filter((_, i) => i !== pi) })}
            />
          ))}
        </div>
      </EditSection>

      {/* Education */}
      <EditSection
        title="Education"
        onAdd={() =>
          set({
            education: [
              ...resume.education,
              { institution: "", degree: "", location: "", period: "" },
            ],
          })
        }
        addLabel="Add education"
      >
        <div className="space-y-3">
          {resume.education.map((edu, i) => (
            <EducationEditor
              key={i}
              edu={edu}
              onChange={(e) =>
                set({ education: resume.education.map((x, j) => (j === i ? e : x)) })
              }
              onRemove={() => set({ education: resume.education.filter((_, j) => j !== i) })}
            />
          ))}
        </div>
      </EditSection>

      {/* Certifications */}
      <EditSection
        title="Achievements & Certifications"
        onAdd={() =>
          set({
            certifications: [...resume.certifications, { name: "", issuer: "", link: "" }],
          })
        }
        addLabel="Add item"
      >
        <div className="space-y-2.5">
          {resume.certifications.map((cert, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg bg-muted/50 p-2.5 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <Input
                value={cert.name}
                onChange={(v) =>
                  set({ certifications: resume.certifications.map((x, j) => (j === i ? { ...x, name: v } : x)) })
                }
                placeholder="Award / certification"
              />
              <Input
                value={cert.issuer}
                onChange={(v) =>
                  set({ certifications: resume.certifications.map((x, j) => (j === i ? { ...x, issuer: v } : x)) })
                }
                placeholder="Issuer"
              />
              <Input
                value={cert.link}
                onChange={(v) =>
                  set({ certifications: resume.certifications.map((x, j) => (j === i ? { ...x, link: v } : x)) })
                }
                placeholder="Credential URL"
              />
              <IconButton label="Remove" onClick={() => set({ certifications: resume.certifications.filter((_, j) => j !== i) })} />
            </div>
          ))}
        </div>
      </EditSection>
    </div>
  )
}

/* ---------- section editors ---------- */

function SkillGroupEditor({
  group,
  onChange,
  onRemove,
}: {
  group: ResumeSkillGroup
  onChange: (g: ResumeSkillGroup) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState("")
  const addItem = () => {
    const v = draft.trim()
    if (!v) return
    onChange({ ...group, items: [...group.items, v] })
    setDraft("")
  }
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-2">
        <Input
          value={group.label}
          onChange={(v) => onChange({ ...group, label: v })}
          placeholder="Group label (e.g. Languages)"
        />
        <IconButton label="Remove group" onClick={onRemove} />
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {group.items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 py-1 pl-2.5 pr-1 text-xs font-medium text-accent"
          >
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange({ ...group, items: group.items.filter((_, j) => j !== i) })}
              className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-accent/20"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addItem()
            }
          }}
          placeholder="Add a skill and press Enter"
          className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring"
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add
        </button>
      </div>
    </div>
  )
}

function ExperienceEditor({
  exp,
  onChange,
  onRemove,
}: {
  exp: ResumeExperience
  onChange: (e: ResumeExperience) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
          <Input value={exp.role} onChange={(v) => onChange({ ...exp, role: v })} placeholder="Role" />
          <Input value={exp.company} onChange={(v) => onChange({ ...exp, company: v })} placeholder="Company" />
          <Input value={exp.location} onChange={(v) => onChange({ ...exp, location: v })} placeholder="Location" />
          <Input value={exp.period} onChange={(v) => onChange({ ...exp, period: v })} placeholder="Period (e.g. 2021 – Present)" />
        </div>
        <IconButton label="Remove role" onClick={onRemove} />
      </div>
      <BulletList
        bullets={exp.bullets}
        onChange={(bullets) => onChange({ ...exp, bullets })}
      />
    </div>
  )
}

function ProjectEditor({
  proj,
  onChange,
  onRemove,
}: {
  proj: ResumeProject
  onChange: (p: ResumeProject) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
          <Input value={proj.name} onChange={(v) => onChange({ ...proj, name: v })} placeholder="Project name" />
          <Input value={proj.link} onChange={(v) => onChange({ ...proj, link: v })} placeholder="Link" />
          <Input value={proj.techStack} onChange={(v) => onChange({ ...proj, techStack: v })} placeholder="Tech stack" />
          <Input value={proj.highlight} onChange={(v) => onChange({ ...proj, highlight: v })} placeholder="Highlight" />
        </div>
        <IconButton label="Remove project" onClick={onRemove} />
      </div>
      <BulletList
        bullets={proj.bullets}
        onChange={(bullets) => onChange({ ...proj, bullets })}
      />
    </div>
  )
}

function EducationEditor({
  edu,
  onChange,
  onRemove,
}: {
  edu: ResumeEducation
  onChange: (e: ResumeEducation) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl bg-muted/50 p-3">
      <div className="grid flex-1 gap-2.5 sm:grid-cols-2">
        <Input value={edu.institution} onChange={(v) => onChange({ ...edu, institution: v })} placeholder="Institution" />
        <Input value={edu.degree} onChange={(v) => onChange({ ...edu, degree: v })} placeholder="Degree" />
        <Input value={edu.location} onChange={(v) => onChange({ ...edu, location: v })} placeholder="Location" />
        <Input value={edu.period} onChange={(v) => onChange({ ...edu, period: v })} placeholder="Period" />
      </div>
      <IconButton label="Remove education" onClick={onRemove} />
    </div>
  )
}

function BulletList({
  bullets,
  onChange,
}: {
  bullets: ResumeBullet[]
  onChange: (b: ResumeBullet[]) => void
}) {
  return (
    <div className="mt-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="eyebrow text-muted-foreground">Bullets</span>
        <button
          type="button"
          onClick={() => onChange([...bullets, { text: "", emphasized: false }])}
          className="text-xs font-medium text-accent hover:underline"
        >
          + Add bullet
        </button>
      </div>
      <div className="space-y-2">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <button
              type="button"
              title={b.emphasized ? "Emphasized (JD-relevant)" : "Emphasize"}
              onClick={() => onChange(bullets.map((x, j) => (j === i ? { ...x, emphasized: !x.emphasized } : x)))}
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition",
                b.emphasized
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              <Highlighter className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <textarea
              value={b.text}
              onChange={(e) => onChange(bullets.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))}
              rows={2}
              placeholder="Describe an achievement…"
              className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring"
            />
            <IconButton label="Remove bullet" onClick={() => onChange(bullets.filter((_, j) => j !== i))} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- primitives ---------- */

function EditSection({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string
  onAdd?: () => void
  addLabel?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
        <h4 className="font-display text-sm font-semibold tracking-tight text-foreground">{title}</h4>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-foreground/70">{label}</span>
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
      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-ring"
    />
  )
}

function IconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-[color:var(--gap)]/10 hover:text-[color:var(--gap)]"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

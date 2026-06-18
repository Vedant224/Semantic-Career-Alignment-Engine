"use client"

import { useState, useTransition } from "react"
import {
  Plus,
  Trash2,
  Save,
  Check,
  Loader2,
  Briefcase,
  Wrench,
  BarChart3,
  User,
} from "lucide-react"
import { updateCareerGraph } from "@/app/actions"
import type { CareerGraph, Experience, Skill } from "@/lib/types"
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
      skills: [...graph.skills, { id: uid("s"), name: "", level: "Intermediate", years: 1 }],
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
          ? {
              ...e,
              metrics: e.metrics.map((m) => (m.id === metricId ? { ...m, ...patch } : m)),
            }
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

  return (
    <div className="space-y-6">
      {/* Profile */}
      <Card icon={User} title="Profile" subtitle="The headline that anchors your generated resume">
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
        <Field label="Professional summary">
          <textarea
            value={graph.summary}
            onChange={(e) => update({ summary: e.target.value })}
            rows={3}
            placeholder="A short summary of who you are and what you do best."
            className="w-full resize-none rounded-lg border border-input bg-background/60 p-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
          />
        </Field>
      </Card>

      {/* Skills */}
      <Card
        icon={Wrench}
        title="Skills"
        subtitle="Each skill becomes a node in your graph and a vector for matching"
        action={<AddButton label="Add skill" onClick={addSkill} />}
      >
        <div className="space-y-2.5">
          {graph.skills.length === 0 && <Empty>No skills yet. Add your first skill.</Empty>}
          {graph.skills.map((skill) => (
            <div
              key={skill.id}
              className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-secondary/30 p-2.5 sm:grid-cols-[1fr_auto_auto_auto]"
            >
              <Input
                value={skill.name}
                onChange={(v) => updateSkill(skill.id, { name: v })}
                placeholder="e.g. PostgreSQL"
              />
              <select
                value={skill.level}
                onChange={(e) => updateSkill(skill.id, { level: e.target.value as Skill["level"] })}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
              >
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={skill.years}
                  onChange={(e) => updateSkill(skill.id, { years: Number(e.target.value) })}
                  className="w-16 rounded-lg border border-input bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/20"
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
        icon={Briefcase}
        title="Experience"
        subtitle="Roles, responsibilities, and the metrics that prove your impact"
        action={<AddButton label="Add role" onClick={addExperience} />}
      >
        <div className="space-y-4">
          {graph.experiences.length === 0 && <Empty>No experience entries yet.</Empty>}
          {graph.experiences.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-border bg-secondary/20 p-4">
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
                <IconButton label="Remove role" onClick={() => removeExperience(exp.id)} />
              </div>

              <Field label="Description" className="mt-3">
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(exp.id, { description: e.target.value })}
                  rows={3}
                  placeholder="Describe what you built and the impact you had. Mention specific technologies."
                  className="w-full resize-none rounded-lg border border-input bg-background/60 p-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
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
                    className="text-xs font-medium text-primary hover:underline"
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

      {/* Save bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-border glass-panel px-5 py-3.5 shadow-lg shadow-primary/5">
        <p className="text-sm text-muted-foreground">
          {graph.skills.length} skills · {graph.experiences.length} roles in your graph
        </p>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/30 transition",
            saved ? "bg-[color:var(--match)]" : "bg-primary hover:bg-primary/90",
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
  )
}

/* ---------- small primitives ---------- */

function Card({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: typeof User
  title: string
  subtitle: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-serif text-lg font-medium text-foreground">{title}</h2>
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
      className="w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/20"
    />
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-[color:var(--gap)]/40 hover:text-[color:var(--gap)]"
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

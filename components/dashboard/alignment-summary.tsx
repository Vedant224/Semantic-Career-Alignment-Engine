import { AlertTriangle, Sparkles } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import { SkillPill } from "./skill-pill"

export function AlignmentSummary({ result }: { result: AlignmentResult }) {
  const { score, matched, partial, gaps } = result
  const total = matched.length + partial.length + gaps.length

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <ScoreRing score={score} />
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-medium text-foreground">Alignment Score</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {matched.length} matched · {partial.length} partial · {gaps.length} gaps across{" "}
            {total} required skills
          </p>
        </div>
      </div>

      {gaps.length > 0 && (
        <div className="mt-5 rounded-xl border border-[color:var(--gap)]/25 bg-[color:var(--gap)]/8 p-4">
          <div className="flex items-center gap-2 text-[color:var(--gap)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">Semantic skill gaps</span>
          </div>
          <p className="mt-1 text-sm text-foreground/80">
            These requirements have no strong match in your career graph. Add evidence to close them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {gaps.map((g) => (
              <SkillPill key={g.skill} skill={g.skill} status="gap" />
            ))}
          </div>
        </div>
      )}

      {(matched.length > 0 || partial.length > 0) && (
        <div className="mt-5">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">Strong & partial matches</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {matched.map((m) => (
              <SkillPill key={m.skill} skill={m.skill} status="match" similarity={m.similarity} />
            ))}
            {partial.map((p) => (
              <SkillPill key={p.skill} skill={p.skill} status="partial" similarity={p.similarity} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreRing({ score }: { score: number }) {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? "var(--match)" : score >= 40 ? "var(--partial)" : "var(--gap)"

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">match</span>
      </div>
    </div>
  )
}

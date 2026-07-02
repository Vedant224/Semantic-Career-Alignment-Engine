"use client"

import { AlertTriangle, Sparkles, Cpu, Shuffle } from "lucide-react"
import type { AlignmentResult } from "@/lib/types"
import { SkillPill } from "./skill-pill"
import { cn } from "@/lib/utils"

export function AlignmentSummary({ result }: { result: AlignmentResult }) {
  const { score, matched, partial, gaps, pipeline } = result
  const total = matched.length + partial.length + gaps.length
  const isVectorEngine = pipeline === "vector-engine"

  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-fade-up space-y-5">
      {/* Header row: score ring + summary */}
      <div className="flex items-center gap-5">
        <ScoreRing score={score} />
        <div className="min-w-0 flex-1">
          <span className="eyebrow text-muted-foreground">Alignment score</span>
          <h3 className="mt-1 font-display text-xl font-semibold text-foreground">
            {score >= 70 ? "Strong fit" : score >= 40 ? "Partial fit" : "Needs work"}
          </h3>
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            <span className="font-medium text-[color:var(--match)]">{matched.length} matched</span>
            <span className="font-medium text-[color:var(--partial)]">{partial.length} partial</span>
            <span className="font-medium text-[color:var(--gap)]">{gaps.length} gaps</span>
            <span>· {total} required</span>
          </p>
        </div>
      </div>

      {/* Pipeline badge */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            isVectorEngine
              ? "border-[color:var(--match)]/30 bg-[color:var(--match)]/10 text-[color:var(--match)]"
              : "border-[color:var(--partial)]/30 bg-[color:var(--partial)]/10 text-[color:var(--partial)]"
          )}
        >
          {isVectorEngine ? (
            <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {isVectorEngine
            ? "Powered by Vector Engine · Supabase pgvector cosine similarity"
            : "Powered by Local Matching · Enable Supabase for vector math"}
        </span>
      </div>

      {/* Cosine Similarity Breakdown Table (only when vector engine was used) */}
      {isVectorEngine && total > 0 && (
        <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cosine Similarity Breakdown · pgvector
            </span>
          </div>
          <div className="divide-y divide-border/50">
            {[...matched, ...partial, ...gaps].map((item) => {
              const pct = Math.round(item.similarity * 100)
              const color =
                item.status === "match"
                  ? "var(--match)"
                  : item.status === "partial"
                  ? "var(--partial)"
                  : "var(--gap)"
              return (
                <div key={item.skill} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-xs text-muted-foreground w-32 shrink-0 truncate" title={item.skill}>
                    {item.skill}
                  </span>
                  {/* Bar */}
                  <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-mono font-semibold w-9 text-right tabular-nums shrink-0"
                    style={{ color }}
                  >
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skill gap section */}
      {gaps.length > 0 && (
        <div className="rounded-xl border border-[color:var(--gap)]/25 bg-[color:var(--gap)]/[0.06] p-4">
          <div className="flex items-center gap-2 text-[color:var(--gap)]">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">
              Skill gaps {isVectorEngine && <span className="font-normal opacity-70">· below 60% cosine similarity</span>}
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground/75">
            These requirements have no strong match in your career graph. Add evidence to close them.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {gaps.map((g) => (
              <SkillPill key={g.skill} skill={g.skill} status="gap" similarity={g.similarity} />
            ))}
          </div>
        </div>
      )}

      {/* Matches section */}
      {(matched.length > 0 || partial.length > 0) && (
        <div>
          <div className="flex items-center gap-2 text-[color:var(--match)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold">
              Strong &amp; partial matches
              {isVectorEngine && <span className="font-normal opacity-70"> · ≥60% cosine similarity</span>}
            </span>
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
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold text-foreground">{score}</span>
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  )
}

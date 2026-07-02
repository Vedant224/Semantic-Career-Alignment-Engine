import { Check, CircleDashed, AlertTriangle } from "lucide-react"
import type { AlignmentStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const config: Record<
  AlignmentStatus,
  { label: string; icon: typeof Check; className: string }
> = {
  match: {
    label: "Matched",
    icon: Check,
    className: "border-[color:var(--match)]/30 bg-[color:var(--match)]/10 text-[color:var(--match)]",
  },
  partial: {
    label: "Partial",
    icon: CircleDashed,
    className: "border-[color:var(--partial)]/30 bg-[color:var(--partial)]/10 text-[color:var(--partial)]",
  },
  gap: {
    label: "Gap",
    icon: AlertTriangle,
    className: "border-[color:var(--gap)]/40 bg-[color:var(--gap)]/10 text-[color:var(--gap)]",
  },
}

export function SkillPill({
  skill,
  status,
  similarity,
}: {
  skill: string
  status: AlignmentStatus
  /** Real cosine similarity score (0–1) from pgvector. Show for all statuses. */
  similarity?: number
}) {
  const { icon: Icon, className } = config[status]

  // Format: show as percentage, e.g. "82%" for matches, "34%" for gaps
  const scoreLabel =
    typeof similarity === "number"
      ? `${Math.round(similarity * 100)}%`
      : null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
      title={scoreLabel ? `Cosine similarity: ${scoreLabel}` : undefined}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {skill}
      {scoreLabel && (
        <span className="opacity-60 tabular-nums">{scoreLabel}</span>
      )}
    </span>
  )
}

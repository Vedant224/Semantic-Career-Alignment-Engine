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
  similarity?: number
}) {
  const { icon: Icon, className } = config[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {skill}
      {typeof similarity === "number" && status !== "gap" && (
        <span className="opacity-60">{Math.round(similarity * 100)}%</span>
      )}
    </span>
  )
}

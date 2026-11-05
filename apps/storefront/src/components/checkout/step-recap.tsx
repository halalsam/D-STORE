import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type RecapRow = { label: string; value: ReactNode; onEdit?: () => void }

/** What the shopper already entered, each row with a way back to its step. */
export function StepRecap({ rows, className }: { rows: RecapRow[]; className?: string }) {
  if (!rows.length) return null
  return (
    <dl className={cn("divide-y divide-line rounded-xl bg-surface px-4 ring-1 ring-line ring-inset", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-start gap-4 py-3.5">
          <dt className="w-20 shrink-0 type-body-sm text-ink-muted">{row.label}</dt>
          <dd className="min-w-0 flex-1 type-body-sm text-ink">{row.value}</dd>
          {row.onEdit && (
            <button
              type="button"
              onClick={row.onEdit}
              aria-label={`Change ${row.label.toLowerCase()}`}
              className="pressable shrink-0 type-body-sm text-accent-ink underline underline-offset-4"
            >
              Change
            </button>
          )}
        </div>
      ))}
    </dl>
  )
}

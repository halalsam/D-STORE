import type { SizeChart } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Measurement table for one size chart. Inches. */
export function SizeTable({ chart, className }: { chart: SizeChart; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg bg-surface", className)}>
      <table className="w-full text-left type-body-sm tabular-nums">
        <thead className="bg-surface-muted type-overline text-ink-muted">
          <tr>
            {["Size", ...chart.columns].map((h) => (
              <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row[0]} className="border-t border-line">
              {row.map((c, i) => (
                <td key={i} className={i === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-ink-muted"}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

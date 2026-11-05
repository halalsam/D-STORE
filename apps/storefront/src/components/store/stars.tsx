import { useId } from "react"
import { cn } from "@/lib/utils"

const PATH = "M12 2.6l2.83 5.94 6.47.82-4.76 4.5 1.22 6.42L12 17.13l-5.76 3.15 1.22-6.42-4.76-4.5 6.47-.82z"

/** Read-only star row. Fractional ratings fill partially (4.5 shows four and a half stars). */
export function Stars({ rating, className, label = true }: { rating: number; className?: string; label?: boolean }) {
  const id = useId()
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-ink", className)} role={label ? "img" : undefined} aria-label={label ? `${rating.toFixed(1)} out of 5 stars` : undefined} aria-hidden={label ? undefined : true}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i))
        return (
          <svg key={i} viewBox="0 0 24 24" className="size-[1em]" aria-hidden>
            <defs>
              <linearGradient id={`${id}-${i}`}>
                <stop offset={fill} stopColor="currentColor" />
                <stop offset={fill} stopColor="currentColor" stopOpacity="0.18" />
              </linearGradient>
            </defs>
            <path d={PATH} fill={`url(#${id}-${i})`} />
          </svg>
        )
      })}
    </span>
  )
}

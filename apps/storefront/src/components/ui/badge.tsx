import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1 rounded-xs px-2 type-caption whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-ink",
        inverse: "bg-surface-inverse text-ink-inverse",
        accent: "bg-accent-soft text-accent-soft-ink",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        media: "material-dark text-ink-on-media",
        plain: "h-auto px-0 text-current",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
)

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

/** Small count bubble for the bag icon. Re-keyed on change so it pops. */
export function CountBubble({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      key={count}
      className={cn(
        "pointer-events-none absolute -top-0.5 -right-0.5 grid h-4 min-w-4 animate-pop place-items-center rounded-pill bg-accent px-1 text-[0.625rem] leading-none font-semibold text-white tabular-nums",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}

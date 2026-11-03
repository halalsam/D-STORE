"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { Toggle, ToggleGroup } from "radix-ui"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

export const chipVariants = cva(
  [
    "pressable inline-flex h-9 shrink-0 items-center gap-2 rounded-pill px-4 type-body-sm whitespace-nowrap",
    "data-[state=on]:bg-surface-inverse data-[state=on]:text-ink-inverse",
    "disabled:opacity-45",
  ],
  {
    variants: {
      tone: {
        /** On canvas or white: muted beige chip (filters). */
        muted: "bg-surface-muted text-ink hover:bg-surface-strong",
        /** On canvas: white chip (mega menu). */
        surface: "bg-surface text-ink hover:bg-beige-50",
        /** Outlined. */
        outline: "bg-transparent text-ink ring-1 ring-line-strong ring-inset hover:bg-surface-muted",
      },
      size: {
        sm: "h-7 px-3 type-caption",
        md: "h-9 px-4 type-body-sm",
      },
    },
    defaultVariants: { tone: "muted", size: "md" },
  }
)

type ChipProps = ComponentProps<typeof Toggle.Root> & VariantProps<typeof chipVariants>

/** Standalone toggle chip. */
export function Chip({ className, tone, size, ...props }: ChipProps) {
  return <Toggle.Root className={cn(chipVariants({ tone, size }), className)} {...props} />
}

type GroupProps = ComponentProps<typeof ToggleGroup.Root>

/** A row of chips. type="multiple" for filters, "single" for exclusive choices. */
export function ChipGroup({ className, ...props }: GroupProps) {
  return <ToggleGroup.Root className={cn("flex flex-wrap gap-2", className)} {...props} />
}

type ItemProps = ComponentProps<typeof ToggleGroup.Item> & VariantProps<typeof chipVariants>

export function ChipGroupItem({ className, tone, size, ...props }: ItemProps) {
  return <ToggleGroup.Item className={cn(chipVariants({ tone, size }), className)} {...props} />
}

/** Overlapping colour dots used in "Shop by color" chips. */
export function SwatchStack({ colors, className }: { colors: string[]; className?: string }) {
  return (
    <span aria-hidden className={cn("flex -space-x-1.5", className)}>
      {colors.map((c) => (
        <span
          key={c}
          style={{ backgroundColor: c }}
          className="size-3 rounded-pill ring-1 ring-black/5"
        />
      ))}
    </span>
  )
}

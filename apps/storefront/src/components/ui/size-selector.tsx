"use client"

import { RadioGroup } from "radix-ui"
import { cn } from "@/lib/utils"

export type SizeOption = { label: string; available: boolean }

type Props = {
  sizes: SizeOption[]
  value?: string
  onValueChange?: (value: string) => void
  /** Pills per row. 7 fits a full apparel run on one line. */
  columns?: 4 | 5 | 7
  className?: string
  name?: string
}

/** Pill grid of sizes. Selected is navy, unavailable is muted and struck through. */
export function SizeSelector({ sizes, value, onValueChange, columns = 5, className, name = "size" }: Props) {
  return (
    <RadioGroup.Root
      name={name}
      value={value}
      onValueChange={onValueChange}
      aria-label="Size"
      className={cn("grid gap-1.5", columns === 7 ? "grid-cols-4 sm:grid-cols-7" : columns === 5 ? "grid-cols-5" : "grid-cols-4", className)}
    >
      {sizes.map((s) => (
        <RadioGroup.Item
          key={s.label}
          value={s.label}
          disabled={!s.available}
          aria-label={s.available ? s.label : `${s.label}, sold out`}
          className={cn(
            "pressable grid h-11 place-items-center rounded-pill bg-surface type-caption tracking-[0.04em] text-ink ring-1 ring-line-strong ring-inset",
            "hover:bg-surface-muted",
            "data-[state=checked]:bg-surface-inverse data-[state=checked]:text-ink-inverse data-[state=checked]:ring-transparent",
            "disabled:bg-surface-muted disabled:text-ink-subtle disabled:line-through disabled:ring-transparent disabled:hover:bg-surface-muted"
          )}
        >
          {s.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}

"use client"

import { ToggleGroup } from "radix-ui"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type SegmentOption = { value: string; label: string; icon?: ReactNode }

type Props = {
  options: SegmentOption[]
  value: string
  onValueChange: (value: string) => void
  label: string
  iconOnly?: boolean
  className?: string
}

/** iOS segmented control: the thumb springs to the selected option. */
export function Segmented({ options, value, onValueChange, label, iconOnly = false, className }: Props) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v)}
      aria-label={label}
      className={cn("relative inline-grid shrink-0 auto-cols-fr grid-flow-col rounded-pill bg-surface-muted p-1", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-pill bg-surface shadow-sm transition-transform duration-(--duration-spring) ease-spring"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          aria-label={o.label}
          className={cn(
            "pressable relative z-[1] inline-flex h-8 items-center justify-center gap-1.5 rounded-pill type-body-sm text-ink-muted transition-colors data-[state=on]:text-ink [&_svg]:size-4",
            iconOnly ? "w-10" : "px-4"
          )}
        >
          {o.icon}
          {!iconOnly && o.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

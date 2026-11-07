"use client"

import { RadioGroup } from "radix-ui"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type RadioCardOption = {
  value: string
  title: ReactNode
  description?: ReactNode
  /** Right-aligned, e.g. price or icon. */
  aside?: ReactNode
  disabled?: boolean
  /** Revealed under the selected card (e.g. UPI ID field). */
  details?: ReactNode
}

type Props = {
  options: RadioCardOption[]
  value?: string
  onValueChange?: (value: string) => void
  label: string
  name?: string
  className?: string
}

/** Stacked selectable cards: delivery methods, payment methods. */
export function RadioCards({ options, value, onValueChange, label, name, className }: Props) {
  return (
    <RadioGroup.Root
      aria-label={label}
      name={name}
      value={value}
      onValueChange={onValueChange}
      className={cn("grid gap-2", className)}
    >
      {options.map((o) => {
        const selected = o.value === value
        return (
          <div
            key={o.value}
            className={cn(
              "rounded-lg bg-surface ring-1 ring-line-strong ring-inset transition-shadow duration-(--duration-fast)",
              selected && "ring-2 ring-ink"
            )}
          >
            <RadioGroup.Item
              value={o.value}
              disabled={o.disabled}
              className="pressable-soft flex w-full items-center gap-3.5 rounded-lg p-4 text-left disabled:opacity-45"
            >
              <span
                aria-hidden
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full ring-1 ring-line-strong ring-inset transition-colors",
                  selected && "bg-ink ring-ink"
                )}
              >
                <RadioGroup.Indicator className="size-2 animate-pop rounded-full bg-white" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block type-body font-medium text-ink">{o.title}</span>
                {o.description && <span className="mt-0.5 block type-caption text-ink-muted">{o.description}</span>}
              </span>
              {o.aside && <span className="shrink-0 type-body-sm text-ink">{o.aside}</span>}
            </RadioGroup.Item>
            {o.details && selected && <div className="animate-rise-in px-4 pb-4">{o.details}</div>}
          </div>
        )
      })}
    </RadioGroup.Root>
  )
}

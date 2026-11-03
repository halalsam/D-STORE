"use client"

import { Select as SelectPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type SelectOption = { value: string; label: string }

type Props = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  label: string
  /** "field": bordered input look. "plain": text + chevron (Sort by row). */
  appearance?: "field" | "plain"
  className?: string
  /** Form field name; Radix renders a hidden native select for form data. */
  name?: string
  required?: boolean
  invalid?: boolean
  id?: string
}

export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  label,
  appearance = "field",
  className,
  name,
  required,
  invalid,
  id,
}: Props) {
  return (
    <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} name={name} required={required}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={cn(
          "group pressable inline-flex items-center justify-between gap-3 type-body text-ink outline-none",
          appearance === "field" &&
            "h-12 w-full rounded-md bg-surface px-4 ring-1 ring-line-strong ring-inset focus-visible:ring-2 focus-visible:ring-accent",
          appearance === "plain" && "h-10 rounded-pill px-3 hover:bg-surface-muted",
          invalid && "ring-danger",
          "data-[placeholder]:text-ink-subtle",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-4 text-ink-muted transition-transform duration-(--duration-spring) ease-spring group-data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            "z-(--z-toast) min-w-(--radix-select-trigger-width) origin-(--radix-select-content-transform-origin) overflow-hidden rounded-xl bg-surface p-1.5 shadow-lg ring-1 ring-line",
            "data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out"
          )}
        >
          <SelectPrimitive.Viewport>
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="flex h-10 cursor-pointer items-center justify-between gap-6 rounded-md px-3 type-body-sm text-ink outline-none select-none data-[highlighted]:bg-surface-muted"
              >
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="size-4 text-accent" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

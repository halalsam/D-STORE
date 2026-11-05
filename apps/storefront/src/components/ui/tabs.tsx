"use client"

import { Tabs as TabsPrimitive } from "radix-ui"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type TabItem = { value: string; label: string; content: ReactNode }

type Props = {
  items: TabItem[]
  /** "underline": equal-width tabs. "pills": scrollable chip row, never truncates. */
  variant?: "underline" | "pills"
  defaultValue?: string
  className?: string
  contentClassName?: string
}

/** Equal-width tabs with an underline that springs between them. */
export function Tabs({ items, defaultValue, className, contentClassName, variant = "underline" }: Props) {
  const [value, setValue] = useState(defaultValue ?? items[0]?.value)
  const index = Math.max(0, items.findIndex((i) => i.value === value))

  return (
    <TabsPrimitive.Root value={value} onValueChange={setValue} className={className}>
      {variant === "pills" ? (
        <TabsPrimitive.List className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5">
          {items.map((item) => (
            <TabsPrimitive.Trigger
              key={item.value}
              value={item.value}
              className="pressable h-9 shrink-0 rounded-pill bg-surface-muted px-4 type-body-sm whitespace-nowrap text-ink transition-colors duration-(--duration-fast) hover:bg-surface-strong data-[state=active]:bg-surface-inverse data-[state=active]:text-ink-inverse"
            >
              {item.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      ) : (
      <TabsPrimitive.List
        className="relative grid border-b border-line"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              "h-12 truncate rounded-md text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink focus-visible:-outline-offset-2 data-[state=active]:text-ink",
              // Four or more equal-width tabs in the narrow buy column: smaller text so labels don't truncate.
              items.length > 3 ? "px-1 type-body-sm" : "px-2 type-body"
            )}
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
        <span
          aria-hidden
          className="absolute -bottom-px left-0 h-0.5 rounded-pill bg-ink transition-transform duration-(--duration-spring) ease-spring"
          style={{ width: `${100 / items.length}%`, transform: `translateX(${index * 100}%)` }}
        />
      </TabsPrimitive.List>
      )}
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className={cn("animate-fade-in focus-visible:outline-none", contentClassName)}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}

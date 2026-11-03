"use client"

import { Tabs as TabsPrimitive } from "radix-ui"
import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type TabItem = { value: string; label: string; content: ReactNode }

type Props = {
  items: TabItem[]
  defaultValue?: string
  className?: string
  contentClassName?: string
}

/** Equal-width tabs with an underline that springs between them. */
export function Tabs({ items, defaultValue, className, contentClassName }: Props) {
  const [value, setValue] = useState(defaultValue ?? items[0]?.value)
  const index = Math.max(0, items.findIndex((i) => i.value === value))

  return (
    <TabsPrimitive.Root value={value} onValueChange={setValue} className={className}>
      <TabsPrimitive.List
        className="relative grid border-b border-line"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            className="h-12 truncate px-2 type-body text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink data-[state=active]:text-ink"
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

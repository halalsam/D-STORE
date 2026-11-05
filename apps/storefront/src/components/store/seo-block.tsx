"use client"

import Link from "next/link"
import { useState } from "react"
import { Tabs } from "@/components/ui/tabs"
import { chipVariants } from "@/components/ui/chip"
import { cn } from "@/lib/utils"

export type LinkSet = { value: string; label: string; links: { label: string; href: string }[] }

/** Collection footer: SEO copy with "Read more" plus tabbed link clouds. */
export function SeoBlock({ title, body, linkSets }: { title: string; body: string; linkSets: LinkSet[] }) {
  const [expanded, setExpanded] = useState(false)
  const chips = (items: LinkSet["links"]) => (
    <div className="flex flex-wrap gap-2 pt-3">
      {items.map((t) => (
        <Link key={t.href} href={t.href} className={chipVariants({ tone: "muted", size: "sm" })}>
          {t.label}
        </Link>
      ))}
    </div>
  )

  return (
    <div className="page-x pb-section">
      <div className="panel grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:gap-16">
        <div>
          <h2 className="type-title">{title}</h2>
          <p className={cn("mt-2 type-body-sm text-ink-muted", !expanded && "line-clamp-2")}>{body}</p>
          <button onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="pressable mt-2 type-body-sm text-accent-ink underline underline-offset-4">
            {expanded ? "Read less" : "Read more"}
          </button>
        </div>
        <Tabs
          variant="pills"
          contentClassName="animate-fade-in"
          items={linkSets.filter((s) => s.links.length).map((s) => ({ value: s.value, label: s.label, content: chips(s.links) }))}
        />
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState } from "react"
import { Tabs } from "@/components/ui/tabs"
import { chipVariants } from "@/components/ui/chip"
import { cn } from "@/lib/utils"

const linkSets = {
  popular: ["Oversized tees", "Linen shirts", "Graphic hoodies", "Cargo pants", "Leather bags", "Caps"],
  category: ["T-Shirts", "Shirts", "Hoodies", "Jackets", "Bottoms", "Accessories"],
  style: ["Streetwear", "Resort", "Minimal", "Graphic", "Workwear"],
  color: ["Navy", "Bone", "Black", "Sand", "Sea green", "Rose"],
}

/** Collection footer: SEO copy with "Read more" plus tabbed link clouds. */
export function SeoBlock({ title, body }: { title: string; body: string }) {
  const [expanded, setExpanded] = useState(false)
  const chips = (items: string[]) => (
    <div className="flex flex-wrap gap-2 pt-3">
      {items.map((t) => (
        <Link key={t} href={`/collections/new-arrivals?q=${encodeURIComponent(t)}`} className={chipVariants({ tone: "muted", size: "sm" })}>
          {t}
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
          items={[
            { value: "popular", label: "Popular searches", content: chips(linkSets.popular) },
            { value: "category", label: "Shop by category", content: chips(linkSets.category) },
            { value: "style", label: "Shop by style", content: chips(linkSets.style) },
            { value: "color", label: "Shop by color", content: chips(linkSets.color) },
          ]}
        />
      </div>
    </div>
  )
}

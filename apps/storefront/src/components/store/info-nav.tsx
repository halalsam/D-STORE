"use client"

import Link from "next/link"
import { chipVariants } from "@/components/ui/chip"

/** Pill nav between sibling help / company pages. */
export function InfoNav({ label, links, current }: { label: string; links: { label: string; href: string }[]; current: string }) {
  return (
    <nav aria-label={label} className="-mx-gutter mt-6 flex gap-2 overflow-x-auto px-gutter pb-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === current ? "page" : undefined}
          data-state={l.href === current ? "on" : undefined}
          className={chipVariants({ tone: "surface" })}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  )
}

import Link from "next/link"
import { Search } from "@/components/ui/icons"
import type { RefObject } from "react"
import { chipVariants, SwatchStack } from "@/components/ui/chip"
import { TextField } from "@/components/ui/text-field"
import type { Navigation } from "@/lib/data/navigation"
import { cn } from "@/lib/utils"

export function MegaMenu({ nav, searchRef }: { nav: Navigation; searchRef?: RefObject<HTMLInputElement | null> }) {
  return (
    <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(12rem,1fr)_minmax(0,3.5fr)] lg:gap-12">
      <div className="grid content-start gap-6">
        <form action="/search" role="search">
          <TextField
            ref={searchRef}
            name="q"
            label="Search"
            hideLabel
            placeholder="Search the store"
            leading={<Search strokeWidth={1.6} />}
            fieldClassName="rounded-pill bg-surface ring-0"
          />
        </form>
        <ul className="grid gap-2.5">
          {nav.collections.map((c, i) => (
            <li key={c.href} className="animate-rise-in" style={{ animationDelay: `${40 + i * 35}ms` }}>
              <Link href={c.href} className="pressable inline-block type-title transition-colors hover:text-accent-ink">
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.6fr]">
        {nav.groups.map((g, gi) => (
          <div key={g.title} className="animate-rise-in" style={{ animationDelay: `${80 + gi * 45}ms` }}>
            <p className="mb-3 type-title">{g.title}</p>
            <div className="flex flex-wrap gap-2">
              {g.links.map((l) => (
                <Link key={l.href} href={l.href} className={chipVariants({ tone: "surface" })}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
        <div className="animate-rise-in [animation-delay:215ms]">
          <p className="mb-3 type-title">Shop by color</p>
          <div className="flex flex-wrap gap-2">
            {nav.colors.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className={cn(chipVariants({ tone: "surface", size: "sm" }), "h-8 uppercase tracking-[0.06em]")}
              >
                {c.label}
                <SwatchStack colors={c.swatches} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

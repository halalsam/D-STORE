import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { InfoNav } from "./info-nav"

const navs = {
  help: {
    label: "Help",
    links: [
      { label: "Shipping", href: "/help/shipping" },
      { label: "Returns", href: "/help/returns" },
      { label: "Size guide", href: "/help/size-guide" },
      { label: "Contact", href: "/help/contact" },
    ],
  },
  company: {
    label: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Stores", href: "/stores" },
      { label: "Careers", href: "/careers" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
}

type Props = {
  nav: keyof typeof navs
  /** Route of this page, highlighted in the pill nav. */
  current: string
  title: string
  intro?: ReactNode
  children: ReactNode
}

/** Help and company pages: heading, pill nav between siblings, stacked panels. */
export function InfoPage({ nav, current, title, intro, children }: Props) {
  const { label, links } = navs[nav]
  return (
    <main className="sheet">
      <div className="page-x pb-section">
        <header className="max-w-2xl pt-2 md:pt-[calc(var(--spacing-section)*0.5)]">
          <p className="type-overline text-ink-muted">{label}</p>
          <h1 className="mt-3 type-display-lg">{title}</h1>
          {intro && <p className="mt-3 type-body-lg text-ink-muted">{intro}</p>}
        </header>
        <InfoNav label={label} links={links} current={current} />
        <div className="mt-6 grid gap-tile">{children}</div>
      </div>
    </main>
  )
}

/** One white panel of an info page. */
export function InfoSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel", className)}>
      <h2 className="type-heading-sm">{title}</h2>
      <div className="mt-3 grid max-w-prose gap-3 type-body text-ink-muted [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-ink">
        {children}
      </div>
    </section>
  )
}

/** Two-column grid of small facts (delivery options, store details). */
export function FactGrid({ items }: { items: { title: string; value: string; note?: string }[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <li key={i.title} className="rounded-lg bg-canvas px-4 py-3.5">
          <p className="type-body-sm font-medium text-ink">{i.title}</p>
          <p className="mt-1 type-heading-sm text-ink">{i.value}</p>
          {i.note && <p className="mt-1 type-body-sm text-ink-muted">{i.note}</p>}
        </li>
      ))}
    </ul>
  )
}

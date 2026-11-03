import type { ReactNode } from "react"

export function DsSection({
  id,
  index,
  title,
  kicker,
  children,
}: {
  id: string
  index: string
  title: string
  kicker: string
  children: ReactNode
}) {
  return (
    <section id={id} className="section scroll-mt-(--header-h)">
      <div className="section-head items-end">
        <div className="flex items-baseline gap-3">
          <span className="type-overline text-ink-subtle tabular-nums">{index}</span>
          <h2 className="type-title">{title}</h2>
        </div>
        <p className="hidden max-w-sm text-right type-caption text-ink-muted sm:block">
          {kicker}
        </p>
      </div>
      {children}
    </section>
  )
}

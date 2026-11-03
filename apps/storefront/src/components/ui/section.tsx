import Link from "next/link"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

type HeaderProps = {
  title: string
  href?: string
  cta?: string
  /** On a white panel the CTA is filled, on canvas it is white. */
  onPanel?: boolean
  aside?: ReactNode
  className?: string
}

export function SectionHeader({ title, href, cta = "Discover more", onPanel = false, aside, className }: HeaderProps) {
  return (
    <div className={cn("section-head", className)}>
      <h2 className="type-title">{title}</h2>
      {aside ??
        (href && (
          <Button asChild size="sm" variant={onPanel ? "primary" : "secondary"} className={onPanel ? undefined : "ring-0"}>
            <Link href={href}>{cta}</Link>
          </Button>
        ))}
    </div>
  )
}

type SectionProps = HeaderProps & {
  children: ReactNode
  /** Wrap in a white inset panel (the "Bags" block in the reference). */
  inset?: boolean
  id?: string
}

/** Titled block inside the page sheet. */
export function Section({ children, inset = false, id, className, ...header }: SectionProps) {
  if (inset) {
    return (
      <section id={id} className={cn("page-x py-[calc(var(--spacing-section)*0.5)]", className)}>
        <div className="panel">
          <SectionHeader {...header} onPanel />
          {children}
        </div>
      </section>
    )
  }
  return (
    <section id={id} className={cn("section", className)}>
      <SectionHeader {...header} />
      {children}
    </section>
  )
}

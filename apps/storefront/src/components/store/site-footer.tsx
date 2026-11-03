import Link from "next/link"
import { DEMO_MODE } from "@/lib/data/mode"
import { NewsletterForm } from "./newsletter-form"

const columns = [
  { title: "Shop", links: [["New in", "/collections/new-arrivals"], ["Coastline", "/collections/coastline"], ["Essentials", "/collections/essentials"], ["Bags", "/collections/accessories"]] },
  { title: "Help", links: [["Shipping", "/help/shipping"], ["Returns", "/help/returns"], ["Size guide", "/help/size-guide"], ["Contact", "/help/contact"]] },
  { title: "Company", links: [["About", "/about"], ["Stores", "/stores"], ["Careers", "/careers"], ["Privacy", "/privacy"]] },
] as const

export function SiteFooter() {
  return (
    <footer className="bg-canvas pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="page-x">
        <div className="panel grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
          <div className="max-w-sm">
            <p className="type-heading-md">Early access, first.</p>
            <p className="mt-2 type-body-sm text-ink-muted">Drops sell out. Get a heads up before they go live.</p>
            <NewsletterForm />
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((c) => (
              <div key={c.title}>
                <p className="type-overline text-ink-muted">{c.title}</p>
                <ul className="mt-3 grid gap-2">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="pressable inline-block type-body text-ink transition-colors hover:text-accent-ink">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
      <div className="page-x overflow-hidden pt-8">
        <p aria-hidden className="font-display text-[clamp(4rem,19vw,22rem)] leading-[0.78] font-bold tracking-[-0.06em] text-ink select-none">
          D-STORE
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 type-caption text-ink-muted">
          <p className="flex items-center gap-2">
            D-STORE. All rights reserved.
            {DEMO_MODE && <span className="rounded-xs bg-accent-soft px-2 py-0.5 text-accent-soft-ink">Demo store: sample data, no real orders</span>}
          </p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">Privacy policy</Link>
            <Link href="/terms" className="hover:text-ink">Terms of service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

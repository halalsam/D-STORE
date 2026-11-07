import Link from "next/link"
import { DEMO_MODE } from "@/lib/data/mode"
import { getNavigation } from "@/lib/data/navigation"
import { NewsletterForm } from "./newsletter-form"
import { Logo } from "@/components/ui/logo"

const staticColumns = [
  { title: "Help", links: [["Shipping", "/help/shipping"], ["Returns", "/help/returns"], ["Size guide", "/help/size-guide"], ["Contact", "/help/contact"]] },
  { title: "Company", links: [["About", "/about"], ["Privacy", "/privacy"]] },
] as const

export async function SiteFooter() {
  const nav = await getNavigation()
  const columns = [{ title: "Shop", links: [...nav.collections.slice(0, 4).map((l) => [l.label, l.href] as const), ["Gift cards", "/products/gift-card"] as const] }, ...staticColumns]
  return (
    <footer className="grid gap-tile bg-canvas px-(--spacing-gutter) pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))]">
      <div className="panel grid gap-12 py-10 md:py-14 lg:grid-cols-12 lg:gap-x-8 lg:py-16">
        <div className="max-w-xl lg:col-span-6">
          <h2 className="type-display-lg text-balance">Early access, first.</h2>
          <p className="mt-4 max-w-md type-body-lg text-ink">Drops sell out. Get a heads up the day before they go live, and nothing else.</p>
          <div className="max-w-md">
            <NewsletterForm />
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-6 lg:self-end">
          {columns.map((c) => (
            <div key={c.title}>
              <h2 className="type-body-sm text-ink-muted">{c.title}</h2>
              <ul className="mt-3 grid gap-2.5">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="pressable inline-block type-body-lg text-ink transition-colors duration-(--duration-fast) hover:text-accent-ink">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="overflow-hidden rounded-panel bg-accent text-ink-on-accent">
        <div className="flex flex-col gap-3 px-[clamp(1rem,0.6rem+1.2vw,2.25rem)] pt-5 pb-6 type-body-sm sm:flex-row sm:items-baseline sm:justify-between md:pt-7 md:pb-10">
          <div className="grid gap-1">
            <p>© MotionFit. All rights reserved.</p>
            {DEMO_MODE && <p className="opacity-80">Demo store: BLUORNG catalog for demonstration, no real orders.</p>}
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="pressable underline-offset-4 hover:underline">Privacy policy</Link>
            <Link href="/terms" className="pressable underline-offset-4 hover:underline">Terms of service</Link>
          </div>
        </div>
        {/* Bleeds off the band's bottom edge on purpose: the name closes the page. */}
        <Logo variant="wordmark-navy" decorative className="-mb-[1.9%] h-auto w-full px-[clamp(0.5rem,0.3rem+0.6vw,1.25rem)]" />
      </div>
    </footer>
  )
}

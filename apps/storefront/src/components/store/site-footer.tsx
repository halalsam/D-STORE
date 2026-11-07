import Link from "next/link"
import { DEMO_MODE } from "@/lib/data/mode"
import { getNavigation } from "@/lib/data/navigation"
import { FooterWordmark } from "./footer-wordmark"
import { NewsletterForm } from "./newsletter-form"

const linkClass = "pressable inline-block type-body-lg font-medium text-ink transition-colors duration-(--duration-fast) hover:text-accent-ink"
const legalClass = "pressable type-body-sm text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"

export async function SiteFooter() {
  const nav = await getNavigation()
  const columns = [
    { title: "Shop", links: [...nav.collections.slice(0, 2).map((l) => [l.label, l.href] as const), ["Gift cards", "/products/gift-card"] as const] },
    { title: "Help", links: [["Shipping", "/help/shipping"], ["Returns", "/help/returns"], ["Size guide", "/help/size-guide"], ["Contact us", "/help/contact"]] as const },
    { title: "You", links: [["About MotionFit", "/about"], ["Account", "/account"], ["Orders", "/account/orders"], ["Saved items", "/account/saved"]] as const },
  ]

  return (
    <footer className="bg-canvas px-(--spacing-gutter) pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))]">
      <div className="panel overflow-hidden pt-10 md:pt-14">
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-y-16">
          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className="sr-only">Newsletter</h2>
            <p className="max-w-[34ch] type-body-lg text-ink">
              Early access to every drop. New releases, restocks and member-only sales, straight to your inbox.
            </p>
            <div className="max-w-sm">
              <NewsletterForm />
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-2 sm:grid-cols-3 lg:col-span-6">
            {columns.map((c) => (
              <div key={c.title}>
                <h2 className="sr-only">{c.title}</h2>
                <ul className="grid gap-3">
                  {c.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className={linkClass}>{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="grid content-start gap-3 type-body-sm text-ink-muted sm:col-span-2 lg:col-span-2">
            <p>Free standard delivery across India. Cash on delivery on every order. Returns within 14 days.</p>
            {DEMO_MODE && <p>Demo store: BLUORNG catalog for demonstration, no real orders.</p>}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2 lg:col-span-12 lg:grid lg:grid-cols-12 lg:gap-x-6">
            <Link href="/privacy" className={`${legalClass} lg:col-start-7 lg:col-span-2`}>Privacy policy</Link>
            <Link href="/terms" className={`${legalClass} lg:col-span-2`}>Terms of service</Link>
            <p className="w-full type-body-sm text-ink-muted lg:col-span-2 lg:w-auto">© MotionFit. All rights reserved.</p>
          </div>
        </div>

        <FooterWordmark className="mt-12 md:mt-16 lg:mt-20" />
      </div>
    </footer>
  )
}

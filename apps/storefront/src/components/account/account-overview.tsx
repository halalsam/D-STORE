"use client"

import Link from "next/link"
import { ArrowRight, Bookmark, MapPin, Package } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { ProductMedia } from "@/components/store/product-media"
import { formatDate, formatPrice } from "@/lib/format"
import { useSaved } from "@/lib/stores/saved"
import type { Address, Customer, Order, Product } from "@/lib/types"
import { AddressLines } from "./address-card"
import { PageTitle } from "./account-nav"
import { OrderTracker, StatusBadge } from "./order-parts"

type Props = { customer: Customer; orders: Order[]; addresses: Address[]; products: Product[] }

export function AccountOverview({ customer, orders, addresses, products }: Props) {
  const saved = useSaved()
  const latest = orders[0]
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0]
  const savedProducts = products.filter((p) => saved.includes(p.handle)).slice(0, 3)

  return (
    <div className="animate-rise-in">
      <PageTitle title={customer.firstName ? `Hi, ${customer.firstName}` : "Your account"} description="Track orders, manage addresses and update your details." />

      <div className="grid gap-grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {latest ? (
          <section className="panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="type-overline text-ink-muted">Latest order</p>
                <p className="mt-1 type-heading-sm">{latest.displayId}</p>
                <p className="type-caption text-ink-muted">Placed {formatDate(latest.createdAt)} · {formatPrice(latest.total, latest.currency)}</p>
              </div>
              <StatusBadge status={latest.status} />
            </div>
            <div className="mt-7"><OrderTracker status={latest.status} /></div>
            <div className="mt-7 flex items-center justify-between gap-4">
              <div className="flex -space-x-3">
                {latest.lines.slice(0, 4).map((l) => (
                  <div key={l.handle + l.size} className="relative aspect-card w-12 overflow-hidden rounded-md ring-2 ring-surface">
                    <ProductMedia tone={l.tone} src={l.thumbnail} silhouette={l.silhouette} alt={l.title} />
                  </div>
                ))}
              </div>
              <Button asChild variant="secondary" size="md">
                <Link href={`/account/orders/${latest.id}`}>View order <ArrowRight strokeWidth={1.6} /></Link>
              </Button>
            </div>
          </section>
        ) : (
          <EmptyCard icon={<Package strokeWidth={1.4} />} title="No orders yet" body="When you place an order it will show up here." href="/collections/new-arrivals" cta="Shop new in" />
        )}

        <section className="panel flex flex-col justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 type-overline text-ink-muted"><MapPin className="size-3.5" /> Default address</p>
            <div className="mt-3">{defaultAddress ? <AddressLines address={defaultAddress} /> : <p className="type-body-sm text-ink-muted">No address saved.</p>}</div>
          </div>
          <Button asChild variant="soft" size="md" className="self-start">
            <Link href="/account/addresses">Manage addresses</Link>
          </Button>
        </section>

        <section className="panel xl:col-span-2">
          <div className="section-head mb-4">
            <p className="flex items-center gap-2 type-title"><Bookmark className="size-4" strokeWidth={1.8} /> Saved items</p>
            <Button asChild variant="ghost" size="sm"><Link href="/account/saved">See all ({saved.length})</Link></Button>
          </div>
          {savedProducts.length ? (
            <div className="grid grid-cols-3 gap-grid sm:max-w-xl">
              {savedProducts.map((p) => (
                <Link key={p.id} href={`/products/${p.handle}`} className="group pressable-soft relative aspect-card overflow-hidden rounded-card">
                  <ProductMedia tone={p.tones[0]} src={p.images[0]} silhouette={p.silhouette} alt={p.title} className="media-zoom" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="type-body-sm text-ink-muted">Tap the bookmark on any product to keep it here.</p>
          )}
        </section>
      </div>
    </div>
  )
}

export function EmptyCard({ icon, title, body, href, cta }: { icon: React.ReactNode; title: string; body: string; href: string; cta: string }) {
  return (
    <section className="panel grid place-items-center py-14 text-center">
      <span className="grid size-14 place-items-center rounded-pill bg-surface-muted text-ink-muted [&_svg]:size-6">{icon}</span>
      <p className="mt-4 type-heading-sm">{title}</p>
      <p className="mt-1 max-w-xs type-body-sm text-ink-muted">{body}</p>
      <Button asChild size="md" className="mt-5"><Link href={href}>{cta}</Link></Button>
    </section>
  )
}

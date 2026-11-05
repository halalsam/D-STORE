import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight, Package } from "@/components/ui/icons"
import { ProductMedia } from "@/components/store/product-media"
import { formatDate, formatPrice } from "@/lib/format"
import type { Order } from "@/lib/types"
import { PageTitle } from "./account-nav"
import { EmptyCard } from "./account-overview"
import { orderItemCount, StatusBadge } from "./order-parts"

export function OrdersView({ orders, notice }: { orders: Order[]; notice?: ReactNode }) {
  return (
    <div>
      <PageTitle title="Orders" description={`${orders.length} ${orders.length === 1 ? "order" : "orders"}`} />
      {notice}
      {orders.length === 0 ? (
        <EmptyCard icon={<Package />} title="No orders yet" body="When you place an order it will show up here." href="/collections/new-arrivals" cta="Shop new in" />
      ) : (
        <ul className="grid gap-tile">
          {orders.map((o, i) => (
            <li key={o.id} className="animate-rise-in" style={{ animationDelay: `${i * 45}ms` }}>
              <Link href={`/account/orders/${o.id}`} className="group pressable-soft flex items-center gap-4 rounded-panel bg-surface p-4 transition-shadow hover:shadow-md md:p-5">
                <div className="flex shrink-0 -space-x-4">
                  {o.lines.slice(0, 3).map((l) => (
                    <div key={l.handle + l.size} className="relative aspect-card w-14 overflow-hidden rounded-md ring-2 ring-surface md:w-16">
                      <ProductMedia tone={l.tone} src={l.thumbnail} silhouette={l.silhouette} alt={l.title} />
                    </div>
                  ))}
                </div>
                <div className="grid min-w-0 flex-1 gap-1 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-8">
                  <div className="min-w-0">
                    <p className="type-title">{o.displayId}</p>
                    <p className="truncate type-caption text-ink-muted">
                      {formatDate(o.createdAt)} · {orderItemCount(o)} {orderItemCount(o) === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div><StatusBadge status={o.status} /></div>
                  <p className="type-body-sm type-price md:text-right">{formatPrice(o.total, o.currency)}</p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-ink-subtle transition-transform duration-(--duration-spring) ease-spring group-hover:translate-x-0.5" strokeWidth={1.6} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

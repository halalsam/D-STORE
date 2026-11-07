import Link from "next/link"
import { AddressLines } from "@/components/account/address-card"
import { LineItem, OrderTracker, Totals } from "@/components/account/order-parts"
import { Button } from "@/components/ui/button"
import { Check } from "@/components/ui/icons"
import type { Order } from "@/lib/types"

export function Confirmation({ order, signedIn }: { order: Order; signedIn: boolean }) {
  const name = order.shippingAddress.firstName
  const register = new URLSearchParams({ register: "1", email: order.email, order: order.id, next: `/account/orders/${order.id}` })
  return (
    <div className="mx-auto grid max-w-2xl gap-tile">
      <section className="panel animate-rise-in text-center">
        <span className="mx-auto grid size-16 animate-pop place-items-center rounded-full bg-accent text-ink-on-accent">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <p className="mt-6 type-overline text-ink-muted">Order {order.displayId}</p>
        <h1 className="mt-2 type-display-lg">{name ? `Thank you, ${name}` : "Thank you"}</h1>
        <p className="mx-auto mt-3 max-w-sm type-body text-ink-muted">
          Your order is confirmed. We sent the details to <span className="text-ink">{order.email}</span>.
        </p>
        <div className="mx-auto mt-8 max-w-md"><OrderTracker status={order.status} /></div>
      </section>

      <section className="panel animate-rise-in [animation-delay:90ms]">
        <h2 className="mb-4 type-title">Items</h2>
        <div className="grid gap-3">{order.lines.map((l) => <LineItem key={l.id ?? l.handle + l.size} line={l} currency={order.currency} />)}</div>
        <div className="mt-6 border-t border-line pt-4">
          <Totals subtotal={order.subtotal} discount={order.discount} shipping={order.shipping} total={order.total} currency={order.currency} />
        </div>
      </section>

      <section className="panel grid animate-rise-in gap-6 [animation-delay:160ms] sm:grid-cols-2">
        <div>
          <p className="mb-2 type-overline text-ink-muted">Shipping to</p>
          <AddressLines address={order.shippingAddress} />
        </div>
        <div className="grid content-start gap-4">
          <div><p className="type-overline text-ink-muted">Delivery</p><p className="mt-1 type-body-sm">{order.delivery.label}</p></div>
          <div><p className="type-overline text-ink-muted">Payment</p><p className="mt-1 type-body-sm">{order.payment.label}</p></div>
        </div>
      </section>

      <div className="grid animate-rise-in gap-2 [animation-delay:220ms] sm:grid-cols-2">
        {signedIn ? (
          <Button asChild variant="secondary" size="xl"><Link href={`/account/orders/${order.id}`}>View order</Link></Button>
        ) : (
          <Button asChild variant="secondary" size="xl"><Link href={`/sign-in?${register}`}>Create an account</Link></Button>
        )}
        <Button asChild size="xl"><Link href="/">Continue shopping</Link></Button>
      </div>
    </div>
  )
}

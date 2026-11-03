"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check } from "@/components/ui/icons"
import { AddressLines } from "@/components/account/address-card"
import { LineItem, OrderTracker, Totals } from "@/components/account/order-parts"
import { Button } from "@/components/ui/button"
import { useCustomer, useOrders } from "@/lib/stores/account"
import { useHydrated } from "@/lib/stores/create-store"

export function Confirmation() {
  const params = useSearchParams()
  const id = params.get("order")
  const orders = useOrders()
  const customer = useCustomer()
  const hydrated = useHydrated()
  const order = orders.find((o) => o.id === id)

  if (!hydrated) return <div className="mx-auto h-[32rem] max-w-2xl rounded-panel skeleton" />

  if (!order) {
    return (
      <div className="panel mx-auto max-w-lg py-14 text-center">
        <h1 className="type-heading-md">Order not found</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Check your email for the confirmation, or view your orders.</p>
        <Button asChild className="mt-6"><Link href="/account/orders">View orders</Link></Button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-2xl gap-grid">
      <section className="panel animate-rise-in text-center">
        <span className="mx-auto grid size-16 animate-pop place-items-center rounded-pill bg-accent text-white">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <p className="mt-6 type-overline text-ink-muted">Order {order.id}</p>
        <h1 className="mt-2 type-display-lg">Thank you, {customer.firstName}</h1>
        <p className="mx-auto mt-3 max-w-sm type-body text-ink-muted">
          Your order is confirmed. We sent the details to <span className="text-ink">{order.email}</span>.
        </p>
        <div className="mx-auto mt-8 max-w-md"><OrderTracker status={order.status} /></div>
      </section>

      <section className="panel animate-rise-in [animation-delay:90ms]">
        <h2 className="mb-4 type-title">Items</h2>
        <div className="grid gap-3">{order.lines.map((l) => <LineItem key={l.handle + l.size} line={l} />)}</div>
        <div className="mt-6 border-t border-line pt-4">
          <Totals subtotal={order.subtotal} discount={order.discount} shipping={order.shipping} total={order.total} />
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
        <Button asChild variant="secondary" size="xl"><Link href={`/account/orders/${order.id}`}>View order</Link></Button>
        <Button asChild size="xl"><Link href="/">Continue shopping</Link></Button>
      </div>
    </div>
  )
}

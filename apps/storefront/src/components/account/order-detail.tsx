"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Copy } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import type { Order } from "@/lib/types"
import { AddressLines } from "./address-card"
import { LineItem, OrderTracker, StatusBadge, Totals } from "./order-parts"

export function OrderDetail({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="animate-rise-in">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3 text-ink-muted">
        <Link href="/account/orders"><ArrowLeft strokeWidth={1.6} /> All orders</Link>
      </Button>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
        <div>
          <h1 className="type-heading-lg">{order.displayId}</h1>
          <p className="mt-1 type-body-sm text-ink-muted">Placed {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-grid xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-grid">
          <section className="panel">
            <OrderTracker status={order.status} />
            {order.tracking && (
              <div className="mt-6 flex items-center justify-between gap-3 rounded-lg bg-canvas px-4 py-3">
                <div>
                  <p className="type-caption text-ink-muted">Tracking number</p>
                  <p className="type-body-sm font-medium tabular-nums">{order.tracking}</p>
                </div>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(order.tracking ?? "")
                    setCopied(true)
                  }}
                >
                  <Copy strokeWidth={1.6} /> {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            )}
          </section>
          <section className="panel">
            <h2 className="mb-4 type-title">Items</h2>
            <div className="grid gap-3">
              {order.lines.map((l) => <LineItem key={l.id ?? l.handle + l.size} line={l} currency={order.currency} />)}
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <Totals subtotal={order.subtotal} discount={order.discount} shipping={order.shipping} total={order.total} currency={order.currency} />
            </div>
          </section>
        </div>

        <div className="grid content-start gap-grid">
          <section className="panel">
            <h2 className="mb-3 type-title">Shipping to</h2>
            <AddressLines address={order.shippingAddress} />
          </section>
          <section className="panel grid gap-4">
            <div>
              <p className="type-overline text-ink-muted">Delivery</p>
              <p className="mt-1 type-body-sm">{order.delivery.label}</p>
            </div>
            <div>
              <p className="type-overline text-ink-muted">Payment</p>
              <p className="mt-1 type-body-sm">{order.payment.label}</p>
            </div>
            <div>
              <p className="type-overline text-ink-muted">Confirmation sent to</p>
              <p className="mt-1 truncate type-body-sm">{order.email}</p>
            </div>
          </section>
          <section className="panel grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <Button asChild variant="secondary" size="lg"><Link href="/help/returns">Start a return</Link></Button>
            <Button asChild variant="soft" size="lg"><Link href="/help/contact">Get help</Link></Button>
          </section>
        </div>
      </div>
    </div>
  )
}

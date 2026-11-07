"use client"

import Link from "next/link"
import { Minus, Plus, ShoppingBag } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet"
import { formatPrice } from "@/lib/format"
import { useBag } from "@/lib/stores/bag"
import { ProductMedia } from "./product-media"

export function BagDrawer() {
  const { lines, count, subtotal, open, setOpen, setQuantity, busy } = useBag()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        title="Bag"
        subtitle={count === 1 ? "1 item" : `${count} items`}
        footer={
          lines.length > 0 ? (
            <>
              <div className="col-span-2 flex items-baseline justify-between px-2 pb-1">
                <span className="type-body-sm text-ink-muted">Subtotal</span>
                <span className="type-heading-sm type-price">{formatPrice(subtotal)}</span>
              </div>
              <SheetClose asChild>
                <Button variant="secondary" size="xl">Keep shopping</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild size="xl">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </SheetClose>
            </>
          ) : undefined
        }
      >
        {lines.length === 0 ? (
          <div className="grid h-full place-items-center p-8 text-center">
            <div className="animate-rise-in">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-surface-muted text-ink-muted">
                <ShoppingBag className="size-6" strokeWidth={1.4} />
              </span>
              <p className="mt-5 type-heading-sm">Your bag is empty</p>
              <p className="mt-1 type-body-sm text-ink-muted">Pieces you add will wait for you here.</p>
              <SheetClose asChild>
                <Button asChild className="mt-6">
                  <Link href="/collections/new-arrivals">Shop new in</Link>
                </Button>
              </SheetClose>
            </div>
          </div>
        ) : (
          <ul className="grid gap-2 p-3">
            {lines.map((l, i) => (
              <li
                key={l.key}
                className="flex animate-rise-in gap-3 rounded-lg bg-surface p-2"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="relative aspect-card w-20 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                  <ProductMedia tone={l.tone} src={l.thumbnail} silhouette={l.silhouette} alt={l.title} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
                  <div>
                    <p className="truncate type-body-sm font-medium">{l.title}</p>
                    <p className="type-caption text-ink-muted">Size {l.size}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-pill bg-surface-muted">
                      <Button variant="ghost" size="icon-sm" aria-label="Decrease quantity" disabled={busy} onClick={() => setQuantity(l.key, l.quantity - 1)}>
                        <Minus strokeWidth={1.6} />
                      </Button>
                      <span className="w-6 text-center type-body-sm tabular-nums">{l.quantity}</span>
                      <Button variant="ghost" size="icon-sm" aria-label="Increase quantity" disabled={busy} onClick={() => setQuantity(l.key, l.quantity + 1)}>
                        <Plus strokeWidth={1.6} />
                      </Button>
                    </div>
                    <span className="type-body-sm type-price">{formatPrice(l.unitPrice * l.quantity)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  )
}

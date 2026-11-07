"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, RotateCcw, Truck, Wallet } from "@/components/ui/icons"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { SizeSelector } from "@/components/ui/size-selector"
import { isSoldOut, type Product } from "@/lib/types"
import { useBag } from "@/lib/stores/bag"
import { NotifyMe } from "./notify-me"
import { SaveToggle } from "./product-card"
import { DeliveryEstimate } from "./delivery-estimate"

const services = [
  { icon: RotateCcw, label: "Returns within 14 days, picked up from your door" },
  { icon: Wallet, label: "Cash on delivery, UPI or card" },
]

/** Title, price, sizes and the two CTAs. */
export function ProductPurchase({ product, rating }: { product: Product; rating?: ReactNode }) {
  const router = useRouter()
  const { add } = useBag()
  const [pending, setPending] = useState<"add" | "buy" | null>(null)
  const firstAvailable = product.sizes.find((s) => s.available)?.label
  const [size, setSize] = useState(firstAvailable)
  const soldOut = isSoldOut(product)
  const apparel = product.sizes.length > 1
  const ctaRef = useRef<HTMLDivElement>(null)
  const [barVisible, setBarVisible] = useState(false)

  // Phones: once the main buttons scroll above the viewport, show a sticky bar.
  useEffect(() => {
    const el = ctaRef.current
    if (!el || soldOut) return
    // The root is stretched far below the viewport, so the buttons only stop
    // "intersecting" once they are above the top edge, even after a fast flick.
    const io = new IntersectionObserver(([entry]) => setBarVisible(!entry.isIntersecting), {
      rootMargin: "0px 0px 100000px 0px",
    })
    io.observe(el)
    return () => io.disconnect()
  }, [soldOut])

  const addToBag = async () => {
    if (!size) return
    setPending("add")
    await add(product, size, { open: true })
    setPending(null)
  }

  return (
    <section className="shrink-0 rounded-xl bg-surface p-4 ring-1 ring-line ring-inset md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-overline text-ink-muted">
            {product.collection ? (
              <Link href={`/collections/${product.collection}`} className="pressable inline-block hover:text-accent-ink">
                {product.collectionTitle ?? "Collection"}
              </Link>
            ) : (
              "MotionFit"
            )}
            {product.type && ` · ${product.type}`}
          </p>
          <h1 className="mt-1.5 type-heading-md">{product.title}</h1>
          {rating}
          <div className="mt-1 flex items-baseline gap-2">
            <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} className="type-body-lg" />
            {product.compareAt && (
              <span className="rounded-xs bg-success-soft px-1.5 py-0.5 type-caption text-success">{Math.round((1 - product.price / product.compareAt) * 100)}% off</span>
            )}
            <span className="type-caption text-ink-subtle">incl. GST</span>
          </div>
        </div>
        <SaveToggle handle={product.handle} title={product.title} tone="ink" className="-mt-1 -mr-1 shrink-0" />
      </div>

      {apparel && !soldOut && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="type-body-sm">
              Size <span className="text-ink-muted">{size ? `· ${size}` : ""}</span>
            </p>
            {product.sizeChart !== null && (
              <a href="#size-fit" className="pressable type-caption text-accent-ink underline underline-offset-4">Size guide</a>
            )}
          </div>
          <SizeSelector sizes={product.sizes} value={size} onValueChange={setSize} columns={4} />
          {product.sizes.some((s) => !s.available) && (
            <NotifyMe
              product={product}
              trigger={<button type="button" className="pressable mt-2 type-caption text-accent-ink underline underline-offset-4">Size sold out? Get an email when it&rsquo;s back</button>}
            />
          )}
        </div>
      )}

      <div ref={ctaRef} className="mt-3 grid grid-cols-2 gap-1.5">
        {soldOut ? (
          <>
            <Button size="xl" disabled>Sold out</Button>
            <NotifyMe product={product} trigger={<Button variant="secondary" size="xl"><Bell strokeWidth={1.6} /> Notify me</Button>} />
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="xl"
              disabled={!size || pending !== null}
              loading={pending === "add"}
              onClick={addToBag}
            >
              Add to bag
            </Button>
            <Button
              size="xl"
              disabled={!size || pending !== null}
              loading={pending === "buy"}
              onClick={async () => {
                if (!size) return
                setPending("buy")
                const ok = await add(product, size, { silent: true })
                if (ok) router.push("/checkout")
                else setPending(null)
              }}
            >
              Buy now
            </Button>
          </>
        )}
      </div>

      <ul className="mt-4 grid gap-2.5 border-t border-line pt-4 type-body-sm text-ink-muted">
        <li className="flex items-start gap-2.5">
          <Truck className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={1.8} />
          <span><DeliveryEstimate /></span>
        </li>
        {services.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-start gap-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-ink" strokeWidth={1.8} /> {label}
          </li>
        ))}
      </ul>

      {/* Phone sticky add-to-bag bar */}
      {!soldOut && (
        <div
          aria-hidden={!barVisible}
          inert={!barVisible}
          className={
            "fixed inset-x-0 bottom-0 z-(--z-header) px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-(--duration-sheet) ease-ios md:hidden " +
            (barVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0")
          }
        >
          <div className="flex items-center gap-3 rounded-pill material bg-surface/85 p-1.5 pl-5 shadow-lg ring-1 ring-line">
            <div className="min-w-0 flex-1">
              <p className="truncate type-body-sm font-medium">{product.title}</p>
              <div className="flex items-baseline gap-1 type-caption text-ink-muted tabular-nums">
                <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} />
                {apparel && size && <span>· {size}</span>}
              </div>
            </div>
            <Button size="lg" disabled={!size || pending !== null} loading={pending === "add"} onClick={addToBag} className="px-6">
              Add to bag
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}

/** Details / Washcare / Shipping. */

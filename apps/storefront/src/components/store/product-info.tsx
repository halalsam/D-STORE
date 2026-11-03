"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Check, RotateCcw, Truck, Wallet } from "@/components/ui/icons"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SizeSelector } from "@/components/ui/size-selector"
import { Tabs } from "@/components/ui/tabs"
import { isSoldOut, type Product, type SizeChart } from "@/lib/types"
import { useBag } from "@/lib/stores/bag"
import { SaveToggle } from "./product-card"

/** Fallback when a product carries no chart of its own. */
const genericChart: SizeChart = {
  columns: ["Chest", "Length", "Shoulder"],
  rows: [
    ["XXS", "38", "26", "21"],
    ["XS", "40", "27", "21.5"],
    ["S", "42", "28", "22"],
    ["M", "44", "29", "22.5"],
    ["L", "46", "30", "23"],
    ["XL", "48", "31", "23.5"],
    ["XXL", "50", "32", "24"],
  ],
}

function SizeGuide({ chart }: { chart?: SizeChart }) {
  const { columns, rows } = chart ?? genericChart
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="pressable type-caption text-accent-ink underline underline-offset-4">Size guide</button>
      </SheetTrigger>
      <SheetContent side="adaptive" title="Size guide" subtitle="Measurements in inches" bodyClassName="p-4 md:p-6">
        <div className="overflow-hidden rounded-lg bg-surface">
          <table className="w-full text-left type-body-sm tabular-nums">
            <thead className="bg-surface-muted type-overline text-ink-muted">
              <tr>
                {["Size", ...columns].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((c, i) => (
                    <td key={i} className={i === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-ink-muted"}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!chart && <p className="mt-4 type-caption text-ink-muted">Boxy fit. Size down for a closer silhouette.</p>}
      </SheetContent>
    </Sheet>
  )
}

const perks = [
  { icon: Truck, label: "Free delivery" },
  { icon: RotateCcw, label: "14 day returns" },
  { icon: Wallet, label: "Cash on delivery" },
]

/** Title, price, sizes and the two CTAs. */
export function ProductPurchase({ product }: { product: Product }) {
  const router = useRouter()
  const { add } = useBag()
  const [pending, setPending] = useState<"add" | "buy" | null>(null)
  const firstAvailable = product.sizes.find((s) => s.available)?.label
  const [size, setSize] = useState(firstAvailable)
  const [notify, setNotify] = useState(false)
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
              "D-STORE"
            )}
            {product.type && ` · ${product.type}`}
          </p>
          <h1 className="mt-1.5 type-heading-md">{product.title}</h1>
          <div className="mt-1 flex items-baseline gap-2">
            <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} className="type-body-lg" />
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
            {product.sizeChart !== null && <SizeGuide chart={product.sizeChart} />}
          </div>
          <SizeSelector sizes={product.sizes} value={size} onValueChange={setSize} columns={4} />
        </div>
      )}

      <div ref={ctaRef} className="mt-3 grid grid-cols-2 gap-1.5">
        {soldOut ? (
          <>
            <Button size="xl" disabled>Sold out</Button>
            <Button variant="secondary" size="xl" onClick={() => setNotify(true)} disabled={notify}>
              {notify ? <><Check strokeWidth={2} /> We will email you</> : <><Bell strokeWidth={1.6} /> Notify me</>}
            </Button>
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

      <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5">
        {perks.map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1 text-center type-caption text-ink-muted sm:flex-row sm:justify-center sm:gap-1.5">
            <Icon className="size-4 shrink-0 sm:size-3.5" strokeWidth={1.8} /> {label}
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
export function ProductTabs({ product }: { product: Product }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl bg-surface px-3 pb-1 ring-1 ring-line ring-inset lg:flex-1">
      <Tabs
        defaultValue="details"
        className="flex min-h-0 flex-1 flex-col"
        contentClassName="min-h-0 flex-1 overflow-y-auto px-3 py-3.5 type-body-sm text-ink-muted md:px-4"
        items={[
          { value: "details", label: "Details", content: <p>{product.description}</p> },
          {
            value: "washcare",
            label: "Washcare",
            content: (
              <ul className="grid gap-1">
                {product.washcare.map((w) => <li key={w}>{w}</li>)}
              </ul>
            ),
          },
          {
            value: "shipping",
            label: "Shipping",
            content: (
              <ul className="grid gap-1">
                <li>Packed within 24 hours, dispatched next day.</li>
                <li>Free delivery nationwide.</li>
                <li>Easy 14 day returns.</li>
              </ul>
            ),
          },
        ]}
      />
    </section>
  )
}

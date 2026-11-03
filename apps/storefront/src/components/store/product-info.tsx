"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SizeSelector } from "@/components/ui/size-selector"
import { Tabs } from "@/components/ui/tabs"
import { isSoldOut, type Product } from "@/lib/mock/catalog"
import { useBag } from "@/lib/stores/bag"
import { SaveToggle } from "./product-card"

const chart = [
  ["XXS", "38", "26", "21"],
  ["XS", "40", "27", "21.5"],
  ["S", "42", "28", "22"],
  ["M", "44", "29", "22.5"],
  ["L", "46", "30", "23"],
  ["XL", "48", "31", "23.5"],
  ["XXL", "50", "32", "24"],
]

function SizeGuide() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="soft" size="sm" className="h-7 rounded-xs px-2.5 type-caption">Size guide</Button>
      </SheetTrigger>
      <SheetContent side="adaptive" title="Size guide" subtitle="Measurements in inches" bodyClassName="p-4 md:p-6">
        <div className="overflow-hidden rounded-lg bg-surface">
          <table className="w-full text-left type-body-sm tabular-nums">
            <thead className="bg-surface-muted type-overline text-ink-muted">
              <tr>
                {["Size", "Chest", "Length", "Shoulder"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.map((row) => (
                <tr key={row[0]} className="border-t border-line">
                  {row.map((c, i) => (
                    <td key={i} className={i === 0 ? "px-4 py-3 font-medium" : "px-4 py-3 text-ink-muted"}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 type-caption text-ink-muted">Boxy fit. Size down for a closer silhouette.</p>
      </SheetContent>
    </Sheet>
  )
}

export function ProductInfo({ product }: { product: Product }) {
  const { add } = useBag()
  const firstAvailable = product.sizes.find((s) => s.available)?.label
  const [size, setSize] = useState(firstAvailable)
  const soldOut = isSoldOut(product)
  const apparel = product.sizes.length > 1

  return (
    <div className="grid gap-grid">
      <div className="rounded-xl bg-surface p-3 ring-1 ring-line ring-inset">
        <div className="flex items-start justify-between gap-3 px-1.5 pt-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="type-heading-sm">{product.title}</h1>
              <SaveToggle handle={product.handle} title={product.title} tone="ink" className="size-8" />
            </div>
            <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} className="type-body text-ink-muted" />
          </div>
          {apparel && <div className="mt-6 shrink-0"><SizeGuide /></div>}
        </div>

        {apparel && (
          <SizeSelector sizes={product.sizes} value={size} onValueChange={setSize} className="mt-3" />
        )}

        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <Button
            variant="secondary"
            size="xl"
            disabled={soldOut || !size}
            onClick={() => size && add(product, size, { open: true })}
          >
            {soldOut ? "Sold out" : "Add to bag"}
          </Button>
          <Button size="xl" disabled={soldOut || !size} onClick={() => size && add(product, size, { open: true })}>
            Buy now
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-surface px-3 pb-2 ring-1 ring-line ring-inset">
        <Tabs
          defaultValue="details"
          contentClassName="px-6 py-4 type-body-sm text-ink-muted"
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
                  <li>Packed within 24 hours.</li>
                  <li>Free delivery nationwide.</li>
                  <li>Dispatches next day.</li>
                </ul>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}

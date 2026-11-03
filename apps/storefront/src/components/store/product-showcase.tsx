"use client"

import Link from "next/link"
import { ZoomIn } from "@/components/ui/icons"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { isSoldOut, type Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProductMedia, productViews } from "./product-media"

const viewLabels = ["Front", "Back", "Detail", "On body", "Flat"]
const label = (i: number) => viewLabels[i] ?? `View ${i + 1}`


type Props = {
  product: Product
  /** Purchase card + tabs, rendered in the pinned right column. */
  details: ReactNode
  /** Small "Complete the look" suggestions at the bottom of the right column. */
  pairs?: Product[]
}

/**
 * Product page top section.
 * lg+: [pinned main image 3:4] [vertical image list, scrolls] [pinned details]
 * <lg: swipe carousel, then details.
 * Column sizing lives in the `pdp-grid` / `pdp-pinned` utilities.
 */
export function ProductShowcase({ product, details, pairs = [] }: Props) {
  const [active, setActive] = useState(0)
  const images = productViews(product)
  const soldOut = isSoldOut(product)
  const tag = soldOut ? "Sold out" : product.badge

  return (
    <div className="page-x pdp-grid">
      {/* Mobile carousel */}
      <MobileCarousel product={product} tag={tag} />

      {/* Pinned main image */}
      <div className="pdp-pinned hidden aspect-card w-full overflow-hidden rounded-card bg-surface-muted lg:block">
        <div key={active} className="absolute inset-0 animate-fade-in">
          <ProductMedia tone={images[active].tone} src={images[active].src} silhouette={product.silhouette} alt={`${product.title}, ${label(active)}`} priority />
        </div>
        {tag && <span className="absolute top-4 left-4 rounded-xs material-dark px-2.5 py-1 type-caption text-ink-on-media">{tag}</span>}
        <ZoomButton product={product} index={active} className="absolute top-3 right-3" />
        <span className="absolute bottom-4 left-4 rounded-pill material-dark px-3 py-1 type-caption text-ink-on-media tabular-nums">
          {label(active)} · {active + 1} / {images.length}
        </span>
      </div>

      {/* Vertical image list (lg+) */}
      <ul aria-label="Product images" className="hidden gap-grid lg:grid">
        {images.map(({ tone, src }, i) => (
          <li key={i}>
            <button
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={`Show ${label(i)}`}
              className="group pressable-soft relative block aspect-card w-full overflow-hidden rounded-card bg-surface-muted"
            >
              <ProductMedia tone={tone} src={src} silhouette={product.silhouette} alt={`${product.title}, ${label(i)}`} className="media-zoom" priority={i === 0} />
              <span className="absolute bottom-3 left-3 rounded-xs material-dark px-2 py-0.5 type-caption text-ink-on-media">{label(i)}</span>
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-card ring-2 ring-ink ring-inset transition-opacity duration-(--duration-base)",
                  i === active ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {/* Pinned details, top aligned, filling the column */}
      <aside className="pdp-pinned mt-grid flex min-w-0 flex-col gap-grid lg:mt-0 lg:h-(--pdp-pinned-h)">
        {details}
        {pairs.length > 0 && (
          <section className="hidden shrink-0 rounded-xl bg-surface p-3 ring-1 ring-line ring-inset lg:block">
            <p className="px-1 pb-2.5 type-overline text-ink-muted">Complete the look</p>
            <div className="grid grid-cols-3 gap-2">
              {pairs.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/products/${p.handle}`} className="group pressable-soft min-w-0">
                  <div className="relative aspect-card overflow-hidden rounded-md bg-surface-muted">
                    <ProductMedia tone={p.tones[0]} src={p.images[0]} silhouette={p.silhouette} alt={p.title} className="media-zoom" />
                  </div>
                  <p className="mt-1.5 truncate type-caption font-medium">{p.title}</p>
                  <Price amount={p.price} currency={p.currency} className="type-caption text-ink-muted" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  )
}

function ZoomButton({ product, index, className }: { product: Product; index: number; className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="media" size="icon-sm" aria-label="Zoom image" className={cn("shadow-sm", className)}>
          <ZoomIn strokeWidth={1.6} />
        </Button>
      </SheetTrigger>
      <SheetContent side="adaptive" title={product.title} bodyClassName="p-3">
        <div className="relative mx-auto aspect-card max-h-[calc(100dvh-10rem)] overflow-hidden rounded-lg">
          <ProductMedia tone={productViews(product)[index].tone} src={productViews(product)[index].src} silhouette={product.silhouette} alt={`${product.title}, enlarged`} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MobileCarousel({ product, tag }: { product: Product; tag?: string }) {
  const [index, setIndex] = useState(0)
  return (
    <div className="relative lg:hidden">
      <div
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar -mx-gutter flex snap-x snap-mandatory gap-grid overflow-x-auto px-gutter"
      >
        {productViews(product).map(({ tone, src }, i) => (
          <div key={i} className="relative aspect-card w-full shrink-0 snap-center overflow-hidden rounded-card">
            <ProductMedia tone={tone} src={src} silhouette={product.silhouette} alt={`${product.title}, ${label(i)}`} priority={i === 0} />
            {i === 0 && tag && <span className="absolute top-3 left-3 rounded-xs material-dark px-2.5 py-1 type-caption text-ink-on-media">{tag}</span>}
            {i === 0 && <ZoomButton product={product} index={0} className="absolute top-3 right-3" />}
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-3 flex justify-center gap-1.5">
        {productViews(product).map((_, i) => (
          <span key={i} className={cn("h-1.5 rounded-pill bg-ink transition-all duration-(--duration-spring) ease-spring", i === index ? "w-4" : "w-1.5 opacity-25")} />
        ))}
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { Toggle } from "radix-ui"
import { ArrowLeft, ArrowRight, Bookmark } from "@/components/ui/icons"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { isSoldOut, type Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toggleSaved, useSaved } from "@/lib/stores/saved"
import { ProductMedia, productViews } from "./product-media"
import { QuickAdd } from "./quick-add"

type Props = {
  product: Product
  density?: "default" | "dense"
  priority?: boolean
  className?: string
}

export function ProductCard({ product, density = "default", priority, className }: Props) {
  const soldOut = isSoldOut(product)
  const href = `/products/${product.handle}`

  if (density === "dense") {
    return (
      <Link
        href={href}
        className={cn("group pressable-soft relative block aspect-card overflow-hidden rounded-md", soldOut && "opacity-45", className)}
      >
        <ProductMedia tone={product.tones[0]} src={product.images[0]} silhouette={product.silhouette} alt={product.title} className="media-zoom" />
      </Link>
    )
  }

  return (
    <article className={cn("group relative", className)}>
      <div className={cn("relative aspect-card overflow-hidden rounded-card bg-surface-muted", soldOut && "opacity-45")}>
        <MediaCarousel product={product} href={href} priority={priority} />
        {soldOut ? (
          <span className="pointer-events-none absolute top-3 left-3 rounded-xs material-dark px-2 py-0.5 type-caption text-ink-on-media">Sold out</span>
        ) : product.badge ? (
          <span className="pointer-events-none absolute top-3 left-3 rounded-xs material-dark px-2 py-0.5 type-caption text-ink-on-media">
            {product.badge}
          </span>
        ) : null}
        <SaveToggle handle={product.handle} title={product.title} className="absolute top-2 right-2" />
      </div>

      <div className={cn("flex items-start justify-between gap-3 px-3 pt-2.5", soldOut && "opacity-45")}>
        <Link href={href} className="min-w-0">
          <h3 className="truncate type-body-sm font-medium">{product.title}</h3>
          <Price amount={product.price} compareAt={product.compareAt} currency={product.currency} className="type-body-sm text-ink-muted" />
        </Link>
        {!soldOut && <QuickAdd product={product} />}
      </div>
    </article>
  )
}

function MediaCarousel({ product, href, priority }: { product: Product; href: string; priority?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const views = productViews(product)
  const count = views.length

  const go = (dir: 1 | -1) => {
    const el = scroller.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * Math.min(count - 1, Math.max(0, index + dir)), behavior: "smooth" })
  }

  return (
    <>
      <div
        ref={scroller}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {views.map(({ tone, src }, i) => (
          <Link
            key={i}
            href={href}
            tabIndex={i === 0 ? 0 : -1}
            aria-label={i === 0 ? product.title : `${product.title}, image ${i + 1}`}
            className="relative h-full w-full shrink-0 snap-start overflow-hidden"
          >
            <ProductMedia
              tone={tone}
              src={src}
              silhouette={product.silhouette}
              alt={`${product.title}, image ${i + 1}`}
              priority={priority && i === 0}
              className="media-zoom"
            />
          </Link>
        ))}
      </div>

      {count > 1 && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between px-2.5 opacity-0 transition-opacity duration-(--duration-base) group-hover:opacity-100 md:flex">
            <Button variant="glass" size="icon" aria-label="Previous image" onClick={() => go(-1)} disabled={index === 0} className="pointer-events-auto disabled:opacity-0">
              <ArrowLeft strokeWidth={1.5} />
            </Button>
            <Button variant="glass" size="icon" aria-label="Next image" onClick={() => go(1)} disabled={index === count - 1} className="pointer-events-auto disabled:opacity-0">
              <ArrowRight strokeWidth={1.5} />
            </Button>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {views.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full bg-white transition-all duration-(--duration-spring) ease-spring",
                  i === index ? "w-4" : "w-1.5 opacity-60"
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}

export function SaveToggle({
  handle,
  title,
  className,
  tone = "media",
}: {
  handle: string
  title: string
  className?: string
  tone?: "media" | "ink"
}) {
  const saved = useSaved()
  return (
    <Toggle.Root
      pressed={saved.includes(handle)}
      onPressedChange={(on) => toggleSaved(handle, on)}
      aria-label={`Save ${title}`}
      className={cn(
        "group/save pressable grid size-9 place-items-center rounded-full",
        tone === "media" ? "text-ink-on-media hover:bg-white/15" : "text-ink-muted hover:bg-surface-muted",
        className
      )}
    >
      <Bookmark
        strokeWidth={1.6}
        className="size-[1.15rem] transition-[fill,transform] duration-(--duration-spring) ease-spring group-data-[state=on]/save:scale-110 group-data-[state=on]/save:fill-current"
      />
    </Toggle.Root>
  )
}

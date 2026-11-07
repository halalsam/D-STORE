"use client"

import { useState } from "react"
import { ZoomIn } from "@/components/ui/icons"
import type { Product, Tone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProductLightbox } from "./product-lightbox"
import { ProductMedia } from "./product-media"

type View = { tone: Tone; src?: string }

/**
 * Product photos. lg+: a two-column grid that scrolls beside the pinned buy
 * panel (an odd count lets the first photo span both columns). Below lg: a
 * swipe carousel. Any photo opens the full-screen lightbox.
 */
export function ProductGallery({ product, views, tag }: { product: Product; views: View[]; tag?: string }) {
  const [zoom, setZoom] = useState<number | null>(null)
  const alt = (i: number) => `${product.title}, photo ${i + 1} of ${views.length}`
  const wide = views.length % 2 === 1

  return (
    <div className="min-w-0">
      <MobileCarousel views={views} silhouette={product.silhouette} alt={alt} tag={tag} onZoom={setZoom} />

      <ul aria-label="Product photos" className="hidden grid-cols-2 gap-tile lg:grid">
        {views.map((v, i) => (
          <li key={i} className={cn(wide && i === 0 && "col-span-2")}>
            <button
              type="button"
              onClick={() => setZoom(i)}
              aria-label={`Zoom ${alt(i)}`}
              className={cn(
                "group relative block w-full cursor-zoom-in overflow-hidden rounded-card bg-surface-muted",
                wide && i === 0 ? "aspect-[4/5]" : "aspect-card"
              )}
            >
              <ProductMedia tone={v.tone} src={v.src} silhouette={product.silhouette} alt={alt(i)} className="media-zoom" priority={i < 2} sizes="(min-width: 1024px) 30vw, 90vw" />
              {i === 0 && tag && <span className="absolute top-4 left-4 rounded-xs material-dark px-2.5 py-1 type-caption text-ink-on-media">{tag}</span>}
              <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-surface-inverse/90 text-ink-inverse opacity-0 shadow-sm transition-opacity duration-(--duration-base) group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn className="size-4" strokeWidth={1.6} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ProductLightbox product={product} views={views} alt={alt} start={zoom} onClose={() => setZoom(null)} />
    </div>
  )
}

function MobileCarousel({
  views,
  silhouette,
  alt,
  tag,
  onZoom,
}: {
  views: View[]
  silhouette: Product["silhouette"]
  alt: (i: number) => string
  tag?: string
  onZoom: (i: number) => void
}) {
  const [index, setIndex] = useState(0)
  return (
    <div className="relative lg:hidden">
      <div
        onScroll={(e) => {
          const el = e.currentTarget
          const slide = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth
          setIndex(Math.min(views.length - 1, Math.round(el.scrollLeft / slide)))
        }}
        className="no-scrollbar -mx-gutter flex snap-x snap-mandatory gap-tile overflow-x-auto overscroll-x-contain px-gutter scroll-px-gutter"
      >
        {views.map((v, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onZoom(i)}
            aria-label={`Zoom ${alt(i)}`}
            className="relative aspect-card w-[86%] shrink-0 snap-center overflow-hidden rounded-card bg-surface-muted sm:w-[62%]"
          >
            <ProductMedia tone={v.tone} src={v.src} silhouette={silhouette} alt={alt(i)} priority={i === 0} sizes="86vw" />
            {i === 0 && tag && <span className="absolute top-3 left-3 rounded-xs material-dark px-2.5 py-1 type-caption text-ink-on-media">{tag}</span>}
          </button>
        ))}
      </div>
      {views.length > 1 && (
        <div aria-hidden className="mt-3 flex justify-center gap-1.5">
          {views.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full bg-ink transition-all duration-(--duration-spring) ease-spring", i === index ? "w-4" : "w-1.5 opacity-25")} />
          ))}
        </div>
      )}
    </div>
  )
}

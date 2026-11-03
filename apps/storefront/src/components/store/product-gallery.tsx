"use client"

import { ZoomIn } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import type { Product } from "@/lib/mock/catalog"
import { cn } from "@/lib/utils"
import { ProductMedia } from "./product-media"

/** Two-up image column on desktop, swipeable carousel on phones. */
export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0)
  const images = product.tones

  return (
    <div className="relative lg:col-span-2">
      <div
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar -mx-gutter flex snap-x snap-mandatory gap-grid overflow-x-auto px-gutter lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0"
      >
        {images.map((tone, i) => (
          <div
            key={i}
            className={cn(
              "relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden rounded-card",
              i === 0 && "lg:row-span-2 lg:aspect-auto"
            )}
          >
            <ProductMedia tone={tone} silhouette={product.silhouette} alt={`${product.title}, image ${i + 1}`} priority={i === 0} />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="media" size="icon-sm" aria-label="Zoom image" className="absolute top-3 left-3 shadow-sm">
                  <ZoomIn strokeWidth={1.6} />
                </Button>
              </SheetTrigger>
              <SheetContent side="adaptive" title={product.title} bodyClassName="p-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <ProductMedia tone={tone} silhouette={product.silhouette} alt={`${product.title}, image ${i + 1}, enlarged`} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ))}
      </div>
      <div aria-hidden className="mt-3 flex justify-center gap-1.5 lg:hidden">
        {images.map((_, i) => (
          <span key={i} className={cn("h-1.5 rounded-pill bg-ink transition-all duration-(--duration-spring) ease-spring", i === index ? "w-4" : "w-1.5 opacity-25")} />
        ))}
      </div>
    </div>
  )
}

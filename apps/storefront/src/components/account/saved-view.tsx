"use client"

import { Bookmark } from "@/components/ui/icons"
import { ProductGrid } from "@/components/store/product-grid"
import { useSaved } from "@/lib/stores/saved"
import type { Product } from "@/lib/types"
import { PageTitle } from "./account-nav"
import { EmptyCard } from "./account-overview"

export function SavedView({ products }: { products: Product[] }) {
  const saved = useSaved()
  const items = saved.map((h) => products.find((p) => p.handle === h)).filter((p) => p !== undefined)
  return (
    <div>
      <PageTitle title="Saved" description={`${items.length} ${items.length === 1 ? "item" : "items"}`} />
      {items.length ? (
        <ProductGrid products={items} />
      ) : (
        <EmptyCard icon={<Bookmark />} title="Nothing saved yet" body="Tap the bookmark on any product and it will wait for you here." href="/collections/new-arrivals" cta="Browse new in" />
      )}
    </div>
  )
}

"use client"

import { Bookmark } from "@/components/ui/icons"
import { ProductGrid } from "@/components/store/product-grid"
import { getProduct } from "@/lib/mock/catalog"
import { useSaved } from "@/lib/stores/saved"
import { PageTitle } from "./account-nav"
import { EmptyCard } from "./account-overview"

export function SavedView() {
  const saved = useSaved()
  const items = saved.map(getProduct).filter((p) => p !== undefined)
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

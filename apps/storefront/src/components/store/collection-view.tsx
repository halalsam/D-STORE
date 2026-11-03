"use client"

import { LayoutGrid, SlidersHorizontal, Grip } from "@/components/ui/icons"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Segmented } from "@/components/ui/segmented"
import { isSoldOut, type Product } from "@/lib/types"
import { emptyFilters, FilterDrawer, type Filters } from "./filter-drawer"
import { ProductGrid } from "./product-grid"

function applyFilters(products: Product[], f: Filters) {
  const list = products.filter((p) => {
    if (f.types.length && !f.types.includes(p.type)) return false
    if (f.colors.length && (!p.color || !f.colors.includes(p.color))) return false
    if (f.sizes.length && !p.sizes.some((s) => s.available && f.sizes.includes(s.label))) return false
    if (f.availability.length) {
      const state = isSoldOut(p) ? "sold-out" : "in-stock"
      if (!f.availability.includes(state)) return false
    }
    return true
  })
  if (f.sort === "price-asc") list.sort((a, b) => a.price - b.price)
  if (f.sort === "price-desc") list.sort((a, b) => b.price - a.price)
  if (f.sort === "newest") list.reverse()
  return list
}

export function CollectionView({ title, products }: { title: string; products: Product[] }) {
  const [density, setDensity] = useState<"default" | "dense">("default")
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const results = useMemo(() => applyFilters(products, filters), [products, filters])
  const active =
    filters.sizes.length + filters.availability.length + filters.types.length + filters.colors.length

  return (
    <section className="section">
      <div className="section-head">
        <h1 className="type-title">{title}</h1>
        <div className="flex items-center gap-2">
          <Segmented
            label="Grid density"
            iconOnly
            value={density}
            onValueChange={(v) => setDensity(v as "default" | "dense")}
            options={[
              { value: "default", label: "Large grid", icon: <LayoutGrid strokeWidth={1.6} /> },
              { value: "dense", label: "Dense grid", icon: <Grip strokeWidth={1.6} /> },
            ]}
          />
          <FilterDrawer
            value={filters}
            onApply={setFilters}
            resultCount={results.length}
            trigger={
              <Button variant="secondary" size="md" className="ring-0">
                <SlidersHorizontal strokeWidth={1.6} />
                <span className="hidden sm:inline">Advanced filters</span>
                {active > 0 && (
                  <span key={active} className="grid h-5 min-w-5 animate-pop place-items-center rounded-pill bg-surface-inverse px-1.5 text-[0.6875rem] text-ink-inverse tabular-nums">
                    {active}
                  </span>
                )}
              </Button>
            }
          />
        </div>
      </div>

      {results.length > 0 ? (
        <ProductGrid key={`${density}-${results.length}-${filters.sort}`} products={results} density={density} priorityCount={4} />
      ) : (
        <div className="panel grid animate-rise-in place-items-center py-20 text-center">
          <p className="type-heading-sm">Nothing matches those filters</p>
          <p className="mt-1 type-body-sm text-ink-muted">Try removing a size or colour.</p>
          <Button variant="soft" className="mt-6" onClick={() => setFilters(emptyFilters)}>Clear filters</Button>
        </div>
      )}
    </section>
  )
}

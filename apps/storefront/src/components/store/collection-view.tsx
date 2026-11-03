"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Grip, LayoutGrid, SlidersHorizontal, X } from "@/components/ui/icons"
import { Segmented } from "@/components/ui/segmented"
import { Select } from "@/components/ui/select"
import { isSoldOut, type Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { activeCount, emptyFilters, FilterDrawer, sortOptions, type Filters } from "./filter-drawer"
import { ProductGrid } from "./product-grid"

type Density = "default" | "dense"

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

const densityOptions = [
  { value: "default", label: "Large grid", icon: <LayoutGrid strokeWidth={1.6} /> },
  { value: "dense", label: "Dense grid", icon: <Grip strokeWidth={1.6} /> },
]

/** Active filter values as removable chips. */
function activeChips(f: Filters) {
  const chips: { key: keyof Filters; value: string; label: string }[] = []
  for (const v of f.sizes) chips.push({ key: "sizes", value: v, label: `Size ${v}` })
  for (const v of f.availability) chips.push({ key: "availability", value: v, label: v === "in-stock" ? "In stock" : "Out of stock" })
  for (const v of f.types) chips.push({ key: "types", value: v, label: v })
  for (const v of f.colors) chips.push({ key: "colors", value: v, label: v })
  return chips
}

export function CollectionView({ title, products }: { title: string; products: Product[] }) {
  const [density, setDensity] = useState<Density>("default")
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const results = useMemo(() => applyFilters(products, filters), [products, filters])
  const available = useMemo(
    () => ({
      sizes: [...new Set(products.flatMap((p) => p.sizes.map((s) => s.label)))],
      types: [...new Set(products.map((p) => p.type))],
      colors: [...new Set(products.flatMap((p) => (p.color ? [p.color] : [])))],
    }),
    [products]
  )

  // Menu and SEO links arrive as ?type= / ?color=. Read after mount so the
  // page stays statically rendered (useSearchParams would opt it out).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const types = params.getAll("type").filter((t) => available.types.includes(t))
    const colors = params.getAll("color").filter((c) => (available.colors as string[]).includes(c))
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL
    if (types.length || colors.length) setFilters((f) => ({ ...f, types, colors: colors as Filters["colors"] }))
  }, [available])
  const active = activeCount(filters)
  const chips = activeChips(filters)
  const countLabel = `${results.length} ${results.length === 1 ? "product" : "products"}`

  const remove = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: (f[key] as string[]).filter((x) => x !== value) }))

  const filterButton = (className?: string) => (
    <Button variant="secondary" size="md" onClick={() => setFilterOpen(true)} className={cn("ring-0", className)}>
      <SlidersHorizontal strokeWidth={1.6} />
      Filter
      {active > 0 && (
        <span key={active} className="grid h-5 min-w-5 animate-pop place-items-center rounded-pill bg-surface-inverse px-1.5 text-[0.6875rem] text-ink-inverse tabular-nums">
          {active}
        </span>
      )}
    </Button>
  )

  return (
    <section className="section pt-2 md:pt-[calc(var(--spacing-section)*0.5)]">
      {/* Title + desktop toolbar */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 md:mb-5">
        <div className="min-w-0">
          <h1 className="type-heading-md md:type-heading-lg">{title}</h1>
          <p className="mt-0.5 type-caption text-ink-muted tabular-nums">{countLabel}</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Select
            label="Sort by"
            appearance="plain"
            options={sortOptions}
            value={filters.sort}
            onValueChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            className="bg-surface"
          />
          <Segmented label="Grid density" iconOnly value={density} onValueChange={(v) => setDensity(v as Density)} options={densityOptions} />
          {filterButton()}
        </div>
      </div>

      {/* Active filters */}
      {chips.length > 0 && (
        <div className="no-scrollbar -mx-gutter mb-4 flex gap-1.5 overflow-x-auto px-gutter">
          {chips.map((c) => (
            <button
              key={`${c.key}:${c.value}`}
              onClick={() => remove(c.key, c.value)}
              aria-label={`Remove ${c.label}`}
              className="pressable inline-flex h-8 shrink-0 animate-scale-in items-center gap-1.5 rounded-pill bg-surface-inverse pr-2.5 pl-3.5 type-body-sm text-ink-inverse"
            >
              {c.label}
              <X className="size-3.5" strokeWidth={2} />
            </button>
          ))}
          <button onClick={() => setFilters((f) => ({ ...emptyFilters, sort: f.sort }))} className="pressable h-8 shrink-0 px-2 type-body-sm text-accent-ink underline underline-offset-4">
            Clear all
          </button>
        </div>
      )}

      {results.length > 0 ? (
        <ProductGrid key={`${density}-${results.length}-${filters.sort}`} products={results} density={density} priorityCount={4} />
      ) : (
        <div className="panel grid animate-rise-in place-items-center py-20 text-center">
          <p className="type-heading-sm">Nothing matches those filters</p>
          <p className="mt-1 type-body-sm text-ink-muted">Try removing a size or colour.</p>
          <Button variant="soft" className="mt-6" onClick={() => setFilters(emptyFilters)}>Clear filters</Button>
        </div>
      )}

      {/* Phone toolbar: floating capsule within thumb reach */}
      <div className="pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-(--z-header) mt-6 flex justify-center md:hidden">
        <div className="pointer-events-auto flex animate-rise-in items-center gap-1 rounded-pill material bg-surface/80 p-1 shadow-lg ring-1 ring-line">
          {filterButton("h-10 bg-transparent px-4 hover:bg-surface-muted")}
          <span aria-hidden className="h-5 w-px bg-line-strong" />
          <Select
            label="Sort by"
            appearance="plain"
            options={sortOptions}
            value={filters.sort}
            onValueChange={(sort) => setFilters((f) => ({ ...f, sort }))}
            className="h-10 max-w-[9.5rem] px-3.5 [&>span]:truncate"
          />
          <span aria-hidden className="h-5 w-px bg-line-strong" />
          <Button
            variant="ghost"
            size="icon"
            aria-label={density === "default" ? "Switch to dense grid" : "Switch to large grid"}
            onClick={() => setDensity((d) => (d === "default" ? "dense" : "default"))}
          >
            {density === "default" ? <Grip strokeWidth={1.6} /> : <LayoutGrid strokeWidth={1.6} />}
          </Button>
        </div>
      </div>

      <FilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={setFilters}
        countFor={(f) => applyFilters(products, f).length}
        available={available}
      />
    </section>
  )
}

"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ChipGroup, ChipGroupItem, SwatchStack } from "@/components/ui/chip"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { colorFamilies, productTypes } from "@/lib/site"

export type Filters = {
  sizes: string[]
  availability: string[]
  types: string[]
  colors: string[]
  sort: string
}

export const emptyFilters: Filters = { sizes: [], availability: [], types: [], colors: [], sort: "featured" }

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
]

const SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]

export function activeCount(f: Filters) {
  return f.sizes.length + f.availability.length + f.types.length + f.colors.length
}

function Group({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line px-5 py-5 md:px-6">
      <legend className="float-left mb-3 flex w-full items-baseline justify-between">
        <span className="type-title">{title}</span>
        {count > 0 && <span className="animate-fade-in type-caption text-ink-muted">{count} selected</span>}
      </legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: Filters
  onApply: (filters: Filters) => void
  /** Live result count for the draft filters, shown on the Apply button. */
  countFor: (filters: Filters) => number
}

/** Bottom sheet on phones, right drawer from md. Sort lives in the toolbar. */
export function FilterDrawer({ open, onOpenChange, value, onApply, countFor }: Props) {
  const [draft, setDraft] = useState(value)
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => setDraft((d) => ({ ...d, [key]: v }))
  const results = countFor(draft)

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(value)
        onOpenChange(o)
      }}
    >
      <SheetContent
        side="responsive"
        title="Filter"
        subtitle={activeCount(draft) ? `${activeCount(draft)} selected` : "Refine the collection"}
        footer={
          <>
            <Button variant="secondary" size="xl" disabled={!activeCount(draft)} onClick={() => setDraft({ ...emptyFilters, sort: draft.sort })}>
              Clear all
            </Button>
            <Button
              size="xl"
              disabled={results === 0}
              onClick={() => {
                onApply(draft)
                onOpenChange(false)
              }}
            >
              {results === 0 ? "No matches" : `Show ${results}`}
            </Button>
          </>
        }
      >
        <Group title="Size" count={draft.sizes.length}>
          <ChipGroup type="multiple" value={draft.sizes} onValueChange={(v) => set("sizes", v)} aria-label="Size" className="grid grid-cols-4 gap-2 sm:flex">
            {SIZES.map((s) => (
              <ChipGroupItem key={s} value={s} className="justify-center sm:min-w-16">{s}</ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
        <Group title="Availability" count={draft.availability.length}>
          <ChipGroup type="multiple" value={draft.availability} onValueChange={(v) => set("availability", v)} aria-label="Availability">
            <ChipGroupItem value="in-stock">In stock</ChipGroupItem>
            <ChipGroupItem value="sold-out">Out of stock</ChipGroupItem>
          </ChipGroup>
        </Group>
        <Group title="Type" count={draft.types.length}>
          <ChipGroup type="multiple" value={draft.types} onValueChange={(v) => set("types", v)} aria-label="Type">
            {productTypes.map((t) => (
              <ChipGroupItem key={t} value={t}>{t}</ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
        <Group title="Color" count={draft.colors.length}>
          <ChipGroup type="multiple" value={draft.colors} onValueChange={(v) => set("colors", v)} aria-label="Color">
            {colorFamilies.map((c) => (
              <ChipGroupItem key={c.name} value={c.name}>
                {c.name}
                <SwatchStack colors={c.swatches} />
              </ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { ChipGroup, ChipGroupItem, SwatchStack } from "@/components/ui/chip"
import { Select } from "@/components/ui/select"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { colorFamilies, productTypes } from "@/lib/mock/catalog"

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

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-b border-line px-6 py-5">
      <legend className="float-left mb-3 w-full type-title">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  )
}

type Props = {
  value: Filters
  onApply: (filters: Filters) => void
  resultCount: number
  trigger: ReactNode
}

export function FilterDrawer({ value, onApply, resultCount, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const set = <K extends keyof Filters>(key: K, v: Filters[K]) => setDraft((d) => ({ ...d, [key]: v }))

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (o) setDraft(value)
        setOpen(o)
      }}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        title="Filter"
        subtitle={`${resultCount} products`}
        footer={
          <>
            <Button variant="secondary" size="xl" onClick={() => setDraft({ ...emptyFilters, sort: draft.sort })}>
              Remove all
            </Button>
            <SheetClose asChild>
              <Button size="xl" onClick={() => onApply(draft)}>Apply</Button>
            </SheetClose>
          </>
        }
      >
        <Group title="Size">
          <ChipGroup type="multiple" value={draft.sizes} onValueChange={(v) => set("sizes", v)} aria-label="Size">
            {SIZES.map((s) => (
              <ChipGroupItem key={s} value={s} className="min-w-16 justify-center">{s}</ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
        <Group title="Availability">
          <ChipGroup type="multiple" value={draft.availability} onValueChange={(v) => set("availability", v)} aria-label="Availability">
            <ChipGroupItem value="in-stock">In stock</ChipGroupItem>
            <ChipGroupItem value="sold-out">Out of stock</ChipGroupItem>
          </ChipGroup>
        </Group>
        <Group title="Type">
          <ChipGroup type="multiple" value={draft.types} onValueChange={(v) => set("types", v)} aria-label="Type">
            {productTypes.map((t) => (
              <ChipGroupItem key={t} value={t}>{t}</ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
        <Group title="Color">
          <ChipGroup type="multiple" value={draft.colors} onValueChange={(v) => set("colors", v)} aria-label="Color">
            {colorFamilies.map((c) => (
              <ChipGroupItem key={c.name} value={c.name}>
                {c.name}
                <SwatchStack colors={c.swatches} />
              </ChipGroupItem>
            ))}
          </ChipGroup>
        </Group>
        <div className="flex items-center justify-between px-6 py-5">
          <p className="type-title">Sort by</p>
          <Select label="Sort by" appearance="plain" options={sortOptions} value={draft.sort} onValueChange={(v) => set("sort", v)} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

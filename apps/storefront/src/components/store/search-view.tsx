"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { chipVariants } from "@/components/ui/chip"
import { ArrowRight, Search, SlidersHorizontal, X } from "@/components/ui/icons"
import { Select } from "@/components/ui/select"
import type { SearchResults } from "@/lib/data/search"
import { popularSearches } from "@/lib/site"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { applyFilters } from "./collection-view"
import { activeCount, emptyFilters, FilterDrawer, sortOptions, type Filters } from "./filter-drawer"
import { ProductGrid } from "./product-grid"

const DEBOUNCE_MS = 280
const searchSort = sortOptions.map((o) => (o.value === "featured" ? { ...o, label: "Best match" } : o))

const RECENT_KEY = "dstore:recent-searches"
const recentListeners = new Set<() => void>()
let recentCache: string[] | null = null

function readRecent(): string[] {
  if (recentCache) return recentCache
  try {
    recentCache = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]")
  } catch {
    recentCache = []
  }
  return recentCache!
}

function writeRecent(next: string[]) {
  recentCache = next
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {}
  recentListeners.forEach((l) => l())
}

function rememberSearch(q: string) {
  const term = q.trim()
  if (term.length < 2) return
  writeRecent([term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 6))
}

const noRecent: string[] = []
function useRecent() {
  return useSyncExternalStore(
    (cb) => {
      recentListeners.add(cb)
      return () => recentListeners.delete(cb)
    },
    readRecent,
    () => noRecent
  )
}

type Props = { results: SearchResults; latest: Product[] }

export function SearchView({ results, latest }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [value, setValue] = useState(results.query)
  const [pending, start] = useTransition()

  const commit = (q: string) => {
    clearTimeout(timer.current)
    const term = q.trim()
    start(() => router.replace(term ? `/search?q=${encodeURIComponent(term)}` : "/search", { scroll: false }))
  }

  const onChange = (q: string) => {
    setValue(q)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(q), DEBOUNCE_MS)
  }

  const leave = () => {
    clearTimeout(timer.current)
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push("/")
  }

  const pick = (q: string) => {
    setValue(q)
    commit(q)
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (results.query && results.products.length) rememberSearch(results.query)
  }, [results.query, results.products.length])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key === "/" && !target.closest("input, textarea, select, [contenteditable]")) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const hasQuery = results.query.length > 0

  return (
    <section className="section pt-4 md:pt-[calc(var(--spacing-section)*0.6)]">
      <form
        role="search"
        className="max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault()
          commit(value)
          inputRef.current?.blur()
        }}
      >
        <label htmlFor="search-q" className="sr-only">Search the store</label>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-12 min-w-0 flex-1 items-center gap-2 rounded-md bg-surface px-4 ring-1 ring-line-strong ring-inset",
              "transition-[box-shadow] duration-(--duration-fast) ease-standard focus-within:ring-2 focus-within:ring-accent",
              value && "pr-1.5"
            )}
          >
            <Search strokeWidth={1.6} className={cn("size-[1.15rem] shrink-0 text-ink-muted transition-opacity duration-(--duration-base)", pending && "opacity-40")} />
            <input
              ref={inputRef}
              id="search-q"
              name="q"
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && value) {
                  e.preventDefault()
                  pick("")
                }
              }}
              autoFocus={!hasQuery}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder="Search polos, hoodies, denim..."
              className="h-[calc(100%-4px)] w-full min-w-0 flex-1 bg-transparent type-body text-ink outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {value && (
              <Button type="button" variant="ghost" size="icon" aria-label="Clear search" onClick={() => pick("")} className="size-9">
                <X strokeWidth={1.8} />
              </Button>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={leave} className="shrink-0">
            Cancel
          </Button>
        </div>
        <p className="mt-3 flex min-h-5 items-center justify-between gap-4 type-caption text-ink-muted" aria-live="polite">
          {hasQuery ? (
            <span className={cn("transition-opacity", pending && "opacity-50")}>
              <span className="text-ink tabular-nums">{results.total}</span> {results.total === 1 ? "result" : "results"} for &ldquo;{results.query}&rdquo;
            </span>
          ) : (
            <span>T-shirts, polos, hoodies, bags and caps. Results update as you type.</span>
          )}
          <span className="hidden shrink-0 items-center gap-1.5 lg:flex">
            Press <kbd className="rounded-xs bg-surface-muted px-1.5 py-0.5 font-sans text-ink">/</kbd> to search,{" "}
            <kbd className="rounded-xs bg-surface-muted px-1.5 py-0.5 font-sans text-ink">Esc</kbd> to clear
          </span>
        </p>
      </form>

      <div className={cn("mt-8 transition-opacity duration-(--duration-base) ease-standard md:mt-12", pending && "opacity-55")}>
        {!hasQuery ? (
          <Discover latest={latest} onPick={pick} />
        ) : results.products.length ? (
          <ResultsBody key={results.query} products={results.products} />
        ) : (
          <NoResults query={results.query} latest={latest} onPick={pick} />
        )}
      </div>
    </section>
  )
}

function TermChips({ terms, onPick, numbered, onPanel }: { terms: string[]; onPick: (q: string) => void; numbered?: boolean; onPanel?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {terms.map((t, i) => (
        <li key={t}>
          <button type="button" onClick={() => onPick(t)} className={cn(chipVariants({ tone: onPanel ? "muted" : "surface" }), "group/chip")}>
            {numbered && <span className="type-caption text-ink-subtle tabular-nums">{String(i + 1).padStart(2, "0")}</span>}
            {t}
            <ArrowRight className="size-3.5 transition-transform duration-(--duration-fast) ease-standard group-hover/chip:translate-x-[3px]" strokeWidth={2} />
          </button>
        </li>
      ))}
    </ul>
  )
}

function Discover({ latest, onPick }: { latest: Product[]; onPick: (q: string) => void }) {
  const recent = useRecent()
  return (
    <div className="grid grid-cols-1 gap-12 md:gap-16">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-3 type-title">Popular searches</h2>
          <TermChips terms={popularSearches} onPick={onPick} numbered />
        </div>
        {recent.length > 0 && (
          <div>
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <h2 className="type-title">Your recent searches</h2>
              <button type="button" onClick={() => writeRecent([])} className="pressable type-caption text-accent-ink underline underline-offset-4">
                Clear
              </button>
            </div>
            <TermChips terms={recent} onPick={onPick} />
          </div>
        )}
      </div>

      {latest.length > 0 && (
        <div>
          <h2 className="mb-4 type-title">New arrivals</h2>
          <ProductGrid products={latest} layout="rail" reveal={false} />
        </div>
      )}
    </div>
  )
}

function NoResults({ query, latest, onPick }: { query: string; latest: Product[]; onPick: (q: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-12 md:gap-16">
      <div className="panel grid justify-items-center px-5 py-12 text-center sm:px-8 md:py-20">
        <p className="type-overline text-ink-muted">No matches</p>
        <h2 className="mt-3 max-w-[18ch] text-balance type-heading-lg md:type-heading-xl">No products match &ldquo;{query}&rdquo;</h2>
        <p className="mt-3 max-w-sm type-body-sm text-ink-muted">Check the spelling or try a broader word like &ldquo;shirt&rdquo; or &ldquo;polo&rdquo;. Popular searches:</p>
        <div className="mt-7 flex justify-center [&_ul]:justify-center">
          <TermChips terms={popularSearches.slice(0, 5)} onPick={onPick} onPanel />
        </div>
      </div>
      {latest.length > 0 && (
        <div>
          <h2 className="mb-4 type-title">New arrivals</h2>
          <ProductGrid products={latest} layout="rail" reveal={false} />
        </div>
      )}
    </div>
  )
}

function ResultsBody({ products }: { products: Product[] }) {
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const visible = useMemo(() => applyFilters(products, filters), [products, filters])
  const active = activeCount(filters)

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3 md:mb-5">
        <p className="type-caption text-ink-muted tabular-nums">{active ? `${visible.length} of ${products.length} shown` : ""}</p>
        <div className="flex items-center gap-2">
          <Select label="Sort by" appearance="plain" options={searchSort} value={filters.sort} onValueChange={(sort) => setFilters((f) => ({ ...f, sort }))} className="bg-surface" />
          <Button variant="secondary" size="md" onClick={() => setFilterOpen(true)} className="ring-0">
            <SlidersHorizontal strokeWidth={1.6} />
            <span className="hidden sm:inline">Filter</span>
            {active > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-surface-inverse px-1.5 text-[0.6875rem] text-ink-inverse tabular-nums">
                {active}
              </span>
            )}
          </Button>
        </div>
      </div>

      {visible.length ? (
        <ProductGrid products={visible} priorityCount={4} reveal={false} />
      ) : (
        <div className="panel grid place-items-center py-16 text-center">
          <p className="type-heading-sm">Nothing matches those filters</p>
          <Button variant="soft" className="mt-6" onClick={() => setFilters((f) => ({ ...emptyFilters, sort: f.sort }))}>Clear filters</Button>
        </div>
      )}

      <FilterDrawer open={filterOpen} onOpenChange={setFilterOpen} value={filters} onApply={setFilters} countFor={(f) => applyFilters(products, f).length} />
    </>
  )
}

export function SearchViewFallback() {
  return (
    <section className="section pt-4 md:pt-[calc(var(--spacing-section)*0.6)]">
      <div className="max-w-3xl">
        <div className="h-12 rounded-md skeleton" />
      </div>
      <div className="mt-8 product-grid gap-y-6 md:mt-12">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-card rounded-card skeleton" />)}
      </div>
    </section>
  )
}


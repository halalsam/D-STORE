import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "@/lib/medusa"
import type { Product } from "@/lib/types"
import { toProduct } from "./adapters"
import { getRegion, PRODUCT_FIELDS } from "./catalog"
import { demoCatalog } from "./mock-backend"
import { DEMO_MODE } from "./mode"

const MAX_RESULTS = 60

type StoreSearchResponse = {
  results: { hits: { id: string }[]; metadata: { count: number | null } }[]
}

export type SearchResults = { query: string; products: Product[]; total: number }

export async function searchProducts(rawQuery: string): Promise<SearchResults> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products", "search")
  const query = rawQuery.trim().slice(0, 120)
  if (!query) return { query, products: [], total: 0 }
  if (DEMO_MODE) return demoSearch(query)

  const { results } = await sdk.client.fetch<StoreSearchResponse>("/store/search", {
    method: "POST",
    body: {
      entity: "product",
      fields: ["id"],
      filters: { q: query },
      pagination: { take: MAX_RESULTS },
      search_options: { match_strategy: "last", typo_tolerance: true, count: "estimated" },
    },
  })
  const result = results[0]
  const ids = result?.hits.map((h) => h.id) ?? []
  if (!ids.length) return { query, products: [], total: 0 }

  // Hits only carry ids; the Store API gives live prices, stock and variant ids for quick add.
  const region = await getRegion()
  const { products } = await sdk.store.product.list({ id: ids, region_id: region.id, fields: PRODUCT_FIELDS, limit: ids.length })
  const byId = new Map(products.map((p) => [p.id, p]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map(toProduct)
    .filter((p) => p.price > 0)
  return { query, products: ordered, total: Math.max(ordered.length, result?.metadata.count ?? 0) }
}

function normalise(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ")
}

function oneTypoApart(a: string, b: string) {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1 || a.length < 4) return false
  let edits = 0
  for (let i = 0, j = 0; i < a.length || j < b.length; i++, j++) {
    if (a[i] === b[j]) continue
    if (++edits > 1) return false
    if (a.length > b.length) j--
    else if (b.length > a.length) i--
  }
  return true
}

function demoSearch(query: string): SearchResults {
  const terms = normalise(query).split(/\s+/).filter(Boolean)
  const products = demoCatalog
    .products()
    .map((p) => {
      const title = normalise(p.title).split(/\s+/)
      const meta = normalise([p.category, p.type, p.collectionTitle, p.color, p.description].filter(Boolean).join(" ")).split(/\s+/)
      let score = 0
      for (const [i, term] of terms.entries()) {
        const last = i === terms.length - 1
        const match = (w: string) => (last && w.startsWith(term)) || oneTypoApart(term, w)
        if (title.some(match)) score += 3
        else if (meta.some(match)) score += 1
        else return null
      }
      return { p, score }
    })
    .filter((x): x is { p: Product; score: number } => !!x)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((x) => x.p)
  return { query, products, total: products.length }
}

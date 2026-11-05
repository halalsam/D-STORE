import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { colorFamilies } from "@/lib/site"
import type { Product } from "@/lib/types"
import { listCollections, listProducts } from "./catalog"

export type NavLink = { label: string; href: string }
export type ColorLink = NavLink & { swatches: string[] }

/** Menu, footer and SEO link data, derived from the live (or demo) catalog. */
export type Navigation = {
  collections: NavLink[]
  groups: { title: string; links: NavLink[] }[]
  colors: ColorLink[]
}

const GROUPS = [
  { title: "Top", types: ["T-shirt", "Polo", "Shirt", "Hoodie", "Sweater", "Jacket"] },
  { title: "Bottom", types: ["Joggers", "Shorts"] },
  { title: "Accessories", types: ["Bag", "Card case", "Cap"] },
]

const plural: Record<string, string> = {
  "T-shirt": "T-Shirts",
  Polo: "Polos",
  Shirt: "Shirts",
  Hoodie: "Hoodies",
  Sweater: "Knitwear",
  Jacket: "Jackets",
  Joggers: "Joggers",
  Shorts: "Shorts",
  Bag: "Bags",
  "Card case": "Card cases",
  Cap: "Caps",
}

/** The collection holding most matching products, so a link lands on a full grid. */
function bestCollection(products: Product[], match: (p: Product) => boolean) {
  const counts = new Map<string, number>()
  for (const p of products) if (match(p) && p.collection) counts.set(p.collection, (counts.get(p.collection) ?? 0) + 1)
  let best: string | undefined
  for (const [handle, n] of counts) if (!best || n > counts.get(best)!) best = handle
  return best
}

export async function getNavigation(): Promise<Navigation> {
  "use cache"
  cacheLife("hours")
  cacheTag("collections", "products")
  const [collections, products] = await Promise.all([listCollections(), listProducts()])

  const typeLink = (type: string): NavLink | null => {
    const handle = bestCollection(products, (p) => p.type === type)
    return handle ? { label: plural[type] ?? type, href: `/collections/${handle}?type=${encodeURIComponent(type)}` } : null
  }

  return {
    collections: collections.map((c) => ({ label: c.title, href: `/collections/${c.handle}` })),
    groups: GROUPS.map((g) => ({ title: g.title, links: g.types.map(typeLink).filter((l): l is NavLink => l !== null) })).filter(
      (g) => g.links.length > 0
    ),
    colors: colorFamilies.flatMap((c) => {
      const handle = bestCollection(products, (p) => p.color === c.name)
      return handle ? [{ label: c.name, swatches: c.swatches, href: `/collections/${handle}?color=${encodeURIComponent(c.name)}` }] : []
    }),
  }
}

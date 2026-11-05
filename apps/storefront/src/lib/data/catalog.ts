import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "@/lib/medusa"
import { DEFAULT_COUNTRY } from "@/lib/site"
import type { Collection, Product } from "@/lib/types"
import { toCollection, toProduct } from "./adapters"
import { demoCatalog } from "./mock-backend"
import { DEMO_MODE } from "./mode"

/**
 * Public catalog reads. Cached with "use cache" (no cookies inside) and
 * tagged so a Medusa webhook can call revalidateTag("products").
 * "minutes" keeps prices and stock fresh within about a minute.
 */

export const PRODUCT_FIELDS = [
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "+variants.manage_inventory",
  "+variants.allow_backorder",
  "+variants.variant_rank",
  "*collection",
  "*categories",
  "*images",
  "+metadata",
].join(",")

export type RegionInfo = { id: string; currencyCode: string }

export async function getRegion(): Promise<RegionInfo> {
  "use cache"
  cacheLife("hours")
  cacheTag("regions")
  if (DEMO_MODE) return { id: "demo", currencyCode: "inr" }
  const { regions } = await sdk.store.region.list({ fields: "id,currency_code,*countries", limit: 50 })
  const region = regions.find((r) => r.countries?.some((c) => c.iso_2 === DEFAULT_COUNTRY)) ?? regions[0]
  if (!region) throw new Error(`No Medusa region found for country "${DEFAULT_COUNTRY}"`)
  return { id: region.id, currencyCode: region.currency_code }
}

export async function listCollections(): Promise<Collection[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("collections")
  if (DEMO_MODE) return demoCatalog.collections()
  const { collections } = await sdk.store.collection.list({ limit: 50, fields: "id,handle,title,metadata" })
  return collections.map(toCollection)
}

export async function getCollection(handle: string): Promise<Collection | null> {
  const all = await listCollections()
  return all.find((c) => c.handle === handle) ?? null
}

export async function listProducts(opts: { collectionHandle?: string } = {}): Promise<Product[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products")
  if (DEMO_MODE) return demoCatalog.products(opts.collectionHandle)
  const region = await getRegion()
  let collectionId: string | undefined
  if (opts.collectionHandle) {
    const collection = await getCollection(opts.collectionHandle)
    if (!collection) return []
    collectionId = collection.id
  }
  const { products } = await sdk.store.product.list({
    region_id: region.id,
    fields: PRODUCT_FIELDS,
    limit: 100,
    ...(collectionId ? { collection_id: [collectionId] } : {}),
  })
  return products.map(toProduct).filter((p) => p.price > 0)
}

export async function getProduct(handle: string): Promise<Product | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products", `product:${handle}`)
  if (DEMO_MODE) return demoCatalog.product(handle)
  const region = await getRegion()
  const { products } = await sdk.store.product.list({ handle, region_id: region.id, fields: PRODUCT_FIELDS, limit: 1 })
  return products[0] ? toProduct(products[0]) : null
}

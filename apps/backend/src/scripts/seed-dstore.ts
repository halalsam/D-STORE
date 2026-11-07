import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createPriceListsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createPromotionsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import catalog from "./data/dstore-catalog.json"

/**
 * D-STORE catalog seed: India region (INR, tax inclusive), Mumbai
 * warehouse, shipping options, collections, categories, products with
 * size variants and stock, a sale price list and the WELCOME10 promo.
 *
 * Idempotent: every step reuses what already exists (matched by name,
 * handle or code) and only creates what is missing, so it is safe to re-run.
 *   pnpm --filter @d-store/backend run seed:dstore
 */

type CatalogProduct = (typeof catalog.products)[number]

const CATEGORY_NAMES: Record<string, string> = {
  "t-shirts": "T-Shirts",
  shirts: "Shirts",
  hoodies: "Hoodies",
  bags: "Bags",
  caps: "Caps",
}

/** Products with a sale price: compareAt in the catalog is the original price. */
function basePrice(p: CatalogProduct) {
  return "compareAt" in p && typeof p.compareAt === "number" ? p.compareAt : p.price
}

export default async function seedDstore({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillmentModule = container.resolve(ModuleRegistrationName.FULFILLMENT)

  // Store currency -----------------------------------------------------
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id", "supported_currencies.currency_code"],
  })
  const store = stores[0]
  const salesChannelId = store.default_sales_channel_id as string
  const currencies = new Set(
    (store.supported_currencies ?? []).map((c) => c?.currency_code).filter(Boolean)
  )
  currencies.delete("inr")
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "MotionFit",
        supported_currencies: [
          { currency_code: "inr", is_default: true },
          ...[...currencies].map((code) => ({ currency_code: code as string, is_default: false })),
        ],
      },
    },
  })

  // Region + tax -------------------------------------------------------
  logger.info("[seed-dstore] Region India (INR)")
  const { data: foundRegions } = await query.graph({ entity: "region", fields: ["id"], filters: { name: "India" } })
  const region = foundRegions[0] ?? (await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          payment_providers: ["pp_system_default"],
          is_tax_inclusive: true,
          metadata: {
            return_window_days: 14,
            free_returns: true,
            shipping_rate: 0,
            handling_days_min: 0,
            handling_days_max: 1,
            transit_days_min: 3,
            transit_days_max: 5,
          },
        },
      ],
    },
  })).result[0]
  // No default rate yet: prices are shown GST inclusive. Add GST rates in
  // Settings -> Tax Regions once the tax setup is confirmed.
  const { data: taxRegions } = await query.graph({ entity: "tax_region", fields: ["id"], filters: { country_code: "in" } })
  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "in", provider_id: "tp_system" }],
    })
  }

  // Warehouse + fulfillment -------------------------------------------
  logger.info("[seed-dstore] Mumbai warehouse and shipping options")
  const { data: foundLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "fulfillment_sets.id", "fulfillment_sets.service_zones.id"],
    filters: { name: "Mumbai Warehouse" },
  })
  let locationId = foundLocations[0]?.id as string | undefined
  let serviceZoneId = foundLocations[0]?.fulfillment_sets?.[0]?.service_zones?.[0]?.id as string | undefined
  if (!locationId) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Mumbai Warehouse",
            address: { address_1: "Bandra West", city: "Mumbai", country_code: "IN", postal_code: "400050" },
          },
        ],
      },
    })
    locationId = result[0].id
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locationId },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: locationId, add: [salesChannelId] },
    })
  }
  if (!serviceZoneId) {
    const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
      name: "India delivery",
      type: "shipping",
      service_zones: [{ name: "India", geo_zones: [{ country_code: "in", type: "country" }] }],
    })
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: locationId },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    })
    serviceZoneId = fulfillmentSet.service_zones[0].id
  }

  const { data: profiles } = await query.graph({ entity: "shipping_profile", fields: ["id"] })
  const shippingProfileId = profiles[0].id
  const rules = [
    { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
    { attribute: "is_return", value: "false", operator: "eq" as const },
  ]
  const option = (name: string, code: string, description: string, amount: number) => ({
    name,
    price_type: "flat" as const,
    provider_id: "manual_manual",
    service_zone_id: serviceZoneId!,
    shipping_profile_id: shippingProfileId,
    type: { label: name, description, code },
    prices: [
      { currency_code: "inr", amount },
      { region_id: region.id, amount },
    ],
    rules,
  })
  const { data: foundOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["name"],
    filters: { service_zone_id: serviceZoneId! },
  })
  const missingOptions = [
    option("Standard delivery", "standard", "3 to 5 business days", 0),
    option("Express delivery", "express", "1 to 2 business days, metro cities", 250),
    option("Pick up in store", "pickup", "MotionFit Bandra, ready in 24 hours", 0),
  ].filter((o) => !foundOptions.some((f) => f.name === o.name))
  if (missingOptions.length) await createShippingOptionsWorkflow(container).run({ input: missingOptions })

  // Collections + categories ------------------------------------------
  logger.info("[seed-dstore] Collections and categories")
  const { data: foundCollections } = await query.graph({ entity: "product_collection", fields: ["id", "handle"] })
  const newCollections = catalog.collections.filter((c) => !foundCollections.some((f) => f.handle === c.handle))
  const collections: { id: string; handle: string }[] = [...foundCollections]
  if (newCollections.length) {
    const { result } = await createCollectionsWorkflow(container).run({
      input: {
        collections: newCollections.map((c) => ({
          title: c.title,
          handle: c.handle,
          metadata: { blurb: c.blurb, tone: c.tone },
        })),
      },
    })
    collections.push(...result)
  }
  const collectionId = (handle: string) => collections.find((c) => c.handle === handle)!.id

  const { data: foundCategories } = await query.graph({ entity: "product_category", fields: ["id", "handle"] })
  const categories: { id: string; handle: string }[] = [...foundCategories]
  const newCategories = Object.entries(CATEGORY_NAMES).filter(([handle]) => !foundCategories.some((c) => c.handle === handle))
  if (newCategories.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: newCategories.map(([handle, name]) => ({ name, handle, is_active: true })),
      },
    })
    categories.push(...result)
  }
  const categoryId = (handle: string) => categories.find((c) => c.handle === handle)!.id

  // Products ----------------------------------------------------------
  const { data: foundProducts } = await query.graph({ entity: "product", fields: ["handle"] })
  const toCreate = catalog.products.filter((p) => !foundProducts.some((f) => f.handle === p.handle))
  logger.info(`[seed-dstore] ${toCreate.length} new products`)
  const sku = (p: CatalogProduct, size: string) =>
    `${p.handle}-${size}`.toUpperCase().replace(/[^A-Z0-9]+/g, "-")

  const products = !toCreate.length ? [] : (await createProductsWorkflow(container).run({
    input: {
      products: toCreate.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        weight: p.silhouette === "bag" ? 1200 : 400,
        collection_id: collectionId(p.collection),
        category_ids: [categoryId(p.category)],
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId }],
        metadata: {
          type: p.type,
          color: p.color,
          silhouette: p.silhouette,
          tones: p.tones,
          washcare: p.washcare,
          ...("badge" in p && p.badge ? { badge: p.badge } : {}),
        },
        options: [{ title: "Size", values: p.sizes.map((s) => s.label), is_exclusive: true }],
        variants: p.sizes.map((s, rank) => ({
          title: s.label,
          sku: sku(p, s.label),
          manage_inventory: true,
          variant_rank: rank,
          options: { Size: s.label },
          prices: [{ amount: basePrice(p), currency_code: "inr" }],
        })),
      })),
    },
  })).result

  // Gift card ---------------------------------------------------------
  // Digital: no shipping profile and no inventory, so it skips delivery at checkout.
  // Not discountable, because the loyalty plugin values the card at the line's pre-discount price.
  if (!foundProducts.some((f) => f.handle === "gift-card")) {
    const amounts = [1000, 2500, 5000]
    const label = (n: number) => `\u20b9${n.toLocaleString("en-IN")}`
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "MotionFit Gift Card",
            handle: "gift-card",
            description: "A digital gift card, emailed with your note within a few minutes of checkout. Spend it on anything at MotionFit; whatever is left stays on the card.",
            status: ProductStatus.PUBLISHED,
            is_giftcard: true,
            discountable: false,
            sales_channels: [{ id: salesChannelId }],
            metadata: { type: "Gift card", silhouette: "card", tones: [["#0A1730", "#7AB3D7"]] },
            options: [{ title: "Amount", values: amounts.map(label) }],
            variants: amounts.map((n, rank) => ({
              title: label(n),
              sku: `GIFT-CARD-${n}`,
              manage_inventory: false,
              variant_rank: rank,
              options: { Amount: label(n) },
              prices: [{ amount: n, currency_code: "inr" }],
            })),
          },
        ],
      },
    })
    logger.info("[seed-dstore] Gift card product")
  }

  // Stock -------------------------------------------------------------
  const stockBySku = new Map<string, number>()
  for (const p of catalog.products) for (const s of p.sizes) stockBySku.set(sku(p, s.label), s.stock)
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.location_id"],
  })
  const unstocked = items.filter(
    (i) => i.sku && stockBySku.has(i.sku) && !(i.location_levels ?? []).some((l) => l?.location_id === locationId)
  )
  if (unstocked.length) await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: unstocked
        .map((i) => ({
          inventory_item_id: i.id,
          location_id: locationId!,
          stocked_quantity: stockBySku.get(i.sku as string) ?? 0,
        })),
    },
  })

  // Sale prices -------------------------------------------------------
  const onSale = toCreate.filter((p) => "compareAt" in p && typeof p.compareAt === "number")
  if (onSale.length && products.length) {
    const { data: saleVariants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product.handle"],
      filters: { product_id: products.filter((p) => onSale.some((s) => s.handle === p.handle)).map((p) => p.id) },
    })
    await createPriceListsWorkflow(container).run({
      input: {
        price_lists_data: [
          {
            title: "Season sale",
            description: "Marked down styles",
            status: "active",
            prices: saleVariants.map((v) => ({
              variant_id: v.id,
              currency_code: "inr",
              amount: onSale.find((p) => p.handle === v.product?.handle)!.price,
            })),
          },
        ],
      },
    })
  }

  // Promotion ---------------------------------------------------------
  const { data: promos } = await query.graph({ entity: "promotion", fields: ["id"], filters: { code: "WELCOME10" } })
  if (!promos.length) await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code: "WELCOME10",
          type: "standard",
          status: "active",
          is_automatic: false,
          application_method: {
            type: "percentage",
            target_type: "order",
            allocation: "across",
            value: 10,
            currency_code: "inr",
          },
        },
      ],
    },
  })

  logger.info("[seed-dstore] Done.")
}

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, getVariantAvailability } from "@medusajs/framework/utils"
import { RESTOCK_MODULE } from "../modules/restock"
import type RestockModuleService from "../modules/restock/service"
import { sendEmail, STOREFRONT_URL } from "../lib/notify"

/** Emails everyone waiting on a variant once it can be bought again, then marks them notified. */
export default async function sendRestockAlerts(container: MedusaContainer) {
  const restock = container.resolve<RestockModuleService>(RESTOCK_MODULE)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const waiting = await restock.listRestockSubscriptions({ notified_at: null }, { take: 1000 })
  if (!waiting.length) {
    return
  }
  const variantIds = [...new Set(waiting.map((s) => s.variant_id))]

  const { data: [store] } = await query.graph({ entity: "store", fields: ["default_sales_channel_id"] })
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "manage_inventory", "allow_backorder", "product.title", "product.handle", "product.status"],
    filters: { id: variantIds },
  })
  const stock = store?.default_sales_channel_id
    ? await getVariantAvailability(query, { variant_ids: variantIds, sales_channel_id: store.default_sales_channel_id })
    : {}

  const inStock = new Map(
    variants
      .filter((v) => v.product?.status === "published")
      .filter((v) => !v.manage_inventory || v.allow_backorder || Number(stock[v.id]?.availability ?? 0) > 0)
      .map((v) => [v.id, v])
  )

  const notified: string[] = []
  for (const sub of waiting) {
    const v = inStock.get(sub.variant_id)
    if (!v) {
      continue
    }
    await sendEmail(container, {
      to: sub.email,
      template: "back-in-stock",
      idempotencyKey: `back-in-stock:${sub.id}:${sub.updated_at ? new Date(sub.updated_at).getTime() : ""}`,
      resourceId: sub.id,
      resourceType: "restock_subscription",
      data: { product_title: v.product?.title ?? "Your pick", variant_title: v.title ?? "", product_url: `${STOREFRONT_URL}/products/${v.product?.handle ?? ""}` },
    })
    notified.push(sub.id)
  }
  if (notified.length) {
    await restock.updateRestockSubscriptions(notified.map((id) => ({ id, notified_at: new Date() })))
  }
}

export const config = { name: "send-restock-alerts", schedule: "*/15 * * * *" }

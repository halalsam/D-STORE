import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/customers/me/product-reviews
 * The customer's own reviews in any status, so the storefront can show
 * "awaiting approval" and prefill edits. The public list only shows approved ones.
 */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({ entity: "order", fields: ["id"], filters: { customer_id: req.auth_context.actor_id } })
  if (!orders.length) {
    res.json({ product_reviews: [] })
    return
  }
  const { data: product_reviews } = await query.graph({
    entity: "product_review",
    fields: ["id", "status", "product_id", "order_id", "order_line_item_id", "rating", "content", "created_at", "images.*", "response.*"],
    filters: { order_id: orders.map((o) => o.id) },
  })
  res.json({ product_reviews })
}

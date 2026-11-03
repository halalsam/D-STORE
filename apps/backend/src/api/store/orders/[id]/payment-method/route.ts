import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/orders/:id/payment-method
 * Returns the payment method the shopper picked at checkout (UPI, card,
 * COD), stored in order metadata. Store order routes do not expose
 * metadata, so this exposes only these two keys. Like the core
 * /store/orders/:id route, the order ID acts as the access token.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "metadata"],
    filters: { id: req.params.id },
  })
  const metadata = (data[0]?.metadata ?? {}) as Record<string, unknown>
  res.json({
    payment_method: typeof metadata.payment_method === "string" ? metadata.payment_method : null,
    upi_id: typeof metadata.upi_id === "string" ? metadata.upi_id : null,
  })
}

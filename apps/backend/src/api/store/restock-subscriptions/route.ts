import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { subscribeRestockWorkflow } from "../../../workflows/subscribe-restock"

export const SubscribeRestock = z.object({ variant_id: z.string().min(1).max(64), email: z.string().email().max(254) })

/**
 * POST /store/restock-subscriptions
 * Guests and customers can ask to be emailed when a sold-out variant is back
 * (job send-restock-alerts). Subscribing again after an alert re-arms it.
 */
export const POST = async (req: AuthenticatedMedusaRequest<z.infer<typeof SubscribeRestock>>, res: MedusaResponse) => {
  const email = req.validatedBody.email.trim().toLowerCase()
  const { variant_id } = req.validatedBody
  const { data: [variant] } = await req.scope.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "variant",
    fields: ["id", "product_id"],
    filters: { id: variant_id },
  })
  if (!variant?.product_id) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  }

  await subscribeRestockWorkflow(req.scope).run({
    input: { email, variant_id, product_id: variant.product_id, customer_id: req.auth_context?.actor_id ?? null },
  })
  res.json({ subscribed: true })
}

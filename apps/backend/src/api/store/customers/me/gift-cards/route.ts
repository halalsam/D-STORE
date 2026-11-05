import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { claimGiftCardWorkflow } from "@medusajs/loyalty-plugin/workflows"

export const ClaimGiftCard = z.object({ code: z.string().trim().min(4).max(64) })

/**
 * POST /store/customers/me/gift-cards
 * Moves a gift card's balance into the customer's store credit, so it can be
 * spent over several orders without retyping the code. The loyalty plugin has
 * the workflow but no store route for it.
 */
export const POST = async (req: AuthenticatedMedusaRequest<z.infer<typeof ClaimGiftCard>>, res: MedusaResponse) => {
  await claimGiftCardWorkflow(req.scope).run({ input: { code: req.validatedBody.code.toUpperCase(), customer_id: req.auth_context.actor_id } })
  res.json({ claimed: true })
}

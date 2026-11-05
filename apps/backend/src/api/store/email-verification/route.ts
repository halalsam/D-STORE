import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { linkGuestOrders, markEmailVerified, normalizeEmail, readVerificationToken } from "../../../lib/guest-orders"

export const VerifyEmail = z.object({ token: z.string().min(1).max(2048) })

/**
 * POST /store/email-verification
 * Confirms the email from the link we sent, then moves every guest order
 * placed with that email into the account. Public: the signed token is the proof.
 */
export const POST = async (req: MedusaRequest<z.infer<typeof VerifyEmail>>, res: MedusaResponse) => {
  const payload = readVerificationToken(req.validatedBody.token)
  if (!payload) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "This link is invalid or has expired")
  }
  const [customer] = await req.scope.resolve(Modules.CUSTOMER).listCustomers({ id: payload.customerId, has_account: true })
  if (!customer || normalizeEmail(customer.email) !== payload.email) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "This link is invalid or has expired")
  }
  await markEmailVerified(req.scope, customer)
  const linked = await linkGuestOrders(req.scope, customer)
  res.json({ verified: true, linked })
}

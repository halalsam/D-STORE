import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { isEmailVerified, sendVerificationEmail } from "../../../../../lib/guest-orders"

/** POST /store/customers/me/email-verification: sends (or resends) the verification link. */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customer = await req.scope.resolve(Modules.CUSTOMER).retrieveCustomer(req.auth_context.actor_id)
  if (isEmailVerified(customer)) {
    res.json({ verified: true, sent: false })
    return
  }
  // One per customer per 10 minutes, via the notification idempotency key.
  const slot = Math.floor(Date.now() / (10 * 60 * 1000))
  await sendVerificationEmail(req.scope, customer, { reason: "signup", idempotencyKey: `verify-email:${customer.id}:${slot}` })
  res.json({ verified: false, sent: true })
}

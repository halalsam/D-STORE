import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { isEmailVerified, linkGuestOrders, markEmailVerified, normalizeEmail } from "../../../../../lib/guest-orders"

export const LinkGuestOrders = z.object({ order_id: z.string().max(64).optional() })

/** The Google provider rejects unverified Google emails, so a matching Google identity proves ownership. */
async function verifiedByGoogle(req: AuthenticatedMedusaRequest, email: string) {
  if (!req.auth_context.auth_identity_id) {
    return false
  }
  const identity = await req.scope
    .resolve(Modules.AUTH)
    .retrieveAuthIdentity(req.auth_context.auth_identity_id, { relations: ["provider_identities"] })
    .catch(() => undefined)
  return !!identity?.provider_identities?.some(
    (p) => p.provider === "google" && typeof p.user_metadata?.email === "string" && normalizeEmail(p.user_metadata.email) === normalizeEmail(email)
  )
}

/**
 * POST /store/customers/me/guest-orders
 * Moves guest orders with the account's email into the account. A verified
 * email gets every guest order; otherwise only `order_id`, whose ID the caller
 * already holds (Medusa treats the order ID as its access token).
 */
export const POST = async (req: AuthenticatedMedusaRequest<z.infer<typeof LinkGuestOrders>>, res: MedusaResponse) => {
  const customer = await req.scope.resolve(Modules.CUSTOMER).retrieveCustomer(req.auth_context.actor_id)
  let verified = isEmailVerified(customer)
  if (!verified && (await verifiedByGoogle(req, customer.email))) {
    await markEmailVerified(req.scope, customer)
    verified = true
  }

  const orderId = req.validatedBody.order_id
  const linked = verified ? await linkGuestOrders(req.scope, customer) : orderId ? await linkGuestOrders(req.scope, customer, [orderId]) : 0
  res.json({ verified, linked })
}

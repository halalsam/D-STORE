import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { findAccountByEmail, isEmailVerified, linkGuestOrders, sendVerificationEmail } from "../lib/guest-orders"

/** A guest checkout with the email of an existing account lands in that account (once the account's email is verified). */
export default async function linkGuestOrder({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({ entity: "order", fields: ["id", "email", "customer.has_account"], filters: { id: event.data.id } })
  if (!order?.email || order.customer?.has_account) {
    return
  }

  const account = await findAccountByEmail(container, order.email)
  if (!account) {
    return
  }
  if (isEmailVerified(account)) {
    await linkGuestOrders(container, account, [order.id])
    return
  }
  await sendVerificationEmail(container, account, { reason: "guest-order", idempotencyKey: `verify-email:${account.id}:${order.id}` })
}

export const config: SubscriberConfig = { event: "order.placed" }

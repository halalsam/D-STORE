import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { isEmailVerified, sendVerificationEmail } from "../lib/guest-orders"
import { sendEmail, STOREFRONT_URL, syncResendContact } from "../lib/notify"

export default async function customerCreated({ event, container }: SubscriberArgs<{ id: string }>) {
  const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(event.data.id)
  if (!customer.email || !customer.has_account) {
    return
  }
  await Promise.all([
    sendEmail(container, {
      to: customer.email,
      template: "customer-welcome",
      idempotencyKey: `customer-welcome:${customer.id}`,
      resourceId: customer.id,
      resourceType: "customer",
      data: { first_name: customer.first_name, shop_url: `${STOREFRONT_URL}/collections/new-arrivals` },
    }),
    syncResendContact(container, {
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      subscribed: customer.metadata?.marketing === true,
    }),
    maybeSendVerification(container, customer),
  ])
}

/** Google accounts are verified by Google (see /store/customers/me/guest-orders); email + password ones need the link. */
async function maybeSendVerification(container: SubscriberArgs["container"], customer: Parameters<typeof sendVerificationEmail>[1]) {
  if (isEmailVerified(customer)) {
    return
  }
  const identities = await container
    .resolve(Modules.AUTH)
    .listProviderIdentities({ provider: "emailpass", entity_id: customer.email })
  if (identities.length) {
    await sendVerificationEmail(container, customer, { reason: "signup", idempotencyKey: `verify-email:${customer.id}:signup` })
  }
}

export const config: SubscriberConfig = { event: "customer.created" }

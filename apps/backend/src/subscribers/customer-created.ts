import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
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
  ])
}

export const config: SubscriberConfig = { event: "customer.created" }

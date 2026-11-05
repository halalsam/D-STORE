import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { syncResendContact } from "../lib/notify"

export default async function customerUpdated({ event, container }: SubscriberArgs<{ id: string }>) {
  const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(event.data.id)
  if (!customer.email || !customer.has_account) {
    return
  }
  await syncResendContact(container, {
    email: customer.email,
    firstName: customer.first_name,
    lastName: customer.last_name,
    subscribed: customer.metadata?.marketing === true,
  })
}

export const config: SubscriberConfig = { event: "customer.updated" }

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail, STOREFRONT_URL } from "../lib/notify"

export default async function orderCanceled({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({ entity: "order", fields: ["id", "display_id", "email", "shipping_address.first_name"], filters: { id: event.data.id } })
  if (!order?.email) {
    return
  }
  await sendEmail(container, {
    to: order.email,
    template: "order-canceled",
    idempotencyKey: `order-canceled:${order.id}`,
    resourceId: order.id,
    resourceType: "order",
    data: { display_id: order.display_id, first_name: order.shipping_address?.first_name, order_url: `${STOREFRONT_URL}/account/orders/${order.id}` },
  })
}

export const config: SubscriberConfig = { event: "order.canceled" }

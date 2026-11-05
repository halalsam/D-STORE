import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail, STOREFRONT_URL } from "../lib/notify"

export default async function shipmentCreated({ event, container }: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (event.data.no_notification) {
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [fulfillment],
  } = await query.graph({
    entity: "fulfillment",
    fields: ["id", "data", "labels.*", "order.id", "order.display_id", "order.email", "order.shipping_address.first_name"],
    filters: { id: event.data.id },
  })
  const order = fulfillment?.order
  if (!order?.email) {
    return
  }
  const label = fulfillment.labels?.[0]
  const data = (fulfillment.data ?? {}) as Record<string, unknown>
  await sendEmail(container, {
    to: order.email,
    template: "order-shipped",
    idempotencyKey: `order-shipped:${fulfillment.id}`,
    resourceId: order.id,
    resourceType: "order",
    data: {
      display_id: order.display_id,
      first_name: order.shipping_address?.first_name,
      carrier: typeof data.courier_name === "string" ? data.courier_name : undefined,
      tracking_number: label?.tracking_number,
      tracking_url: label?.tracking_url || undefined,
      order_url: `${STOREFRONT_URL}/account/orders/${order.id}`,
    },
  })
}

export const config: SubscriberConfig = { event: "shipment.created" }

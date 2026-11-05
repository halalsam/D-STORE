import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { formatMoney, sendEmail, STOREFRONT_URL } from "../lib/notify"

export default async function orderPlaced({ event, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "currency_code",
      "item_subtotal",
      "shipping_total",
      "discount_total",
      "total",
      "items.*",
      "shipping_address.*",
    ],
    filters: { id: event.data.id },
  })
  if (!order?.email) {
    return
  }

  const cur = order.currency_code
  const a = order.shipping_address
  const address = a
    ? [[a.first_name, a.last_name].filter(Boolean).join(" "), a.address_1, a.address_2, [a.city, a.province, a.postal_code].filter(Boolean).join(" "), a.phone]
        .filter(Boolean)
        .join("\n")
    : ""

  await sendEmail(container, {
    to: order.email,
    template: "order-placed",
    idempotencyKey: `order-placed:${order.id}`,
    resourceId: order.id,
    resourceType: "order",
    data: {
      order_id: order.id,
      display_id: order.display_id,
      first_name: a?.first_name,
      lines: (order.items ?? []).filter(Boolean).map((i) => ({
        title: i!.product_title ?? i!.title,
        variant: i!.variant_title ?? undefined,
        quantity: Number(i!.quantity),
        total: formatMoney(i!.total, cur),
      })),
      subtotal: formatMoney(order.item_subtotal, cur),
      shipping: Number(order.shipping_total) ? formatMoney(order.shipping_total, cur) : "Free",
      discount: Number(order.discount_total) ? formatMoney(order.discount_total, cur) : undefined,
      total: formatMoney(order.total, cur),
      address,
      order_url: `${STOREFRONT_URL}/account/orders/${order.id}`,
    },
  })
}

export const config: SubscriberConfig = { event: "order.placed" }

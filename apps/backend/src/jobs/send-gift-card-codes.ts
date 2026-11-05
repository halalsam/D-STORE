import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { formatMoney, sendEmail, STOREFRONT_URL } from "../lib/notify"

type GiftCard = { id: string; code: string; value: number; currency_code: string; reference: string | null; reference_id: string | null; line_item_id: string | null; metadata: Record<string, unknown> | null }
type LoyaltyService = {
  listGiftCards: (filters: Record<string, unknown>, config?: Record<string, unknown>) => Promise<GiftCard[]>
  updateGiftCards: (data: { id: string; metadata: Record<string, unknown> }[]) => Promise<unknown>
}

/**
 * The loyalty plugin issues a gift card per purchased unit on order.placed but
 * never tells anyone the code. This emails each new code once (to the
 * recipient the shopper named, otherwise the buyer) and marks it sent, so a
 * failed send is retried on the next run.
 */
export default async function sendGiftCardCodes(container: MedusaContainer) {
  const loyalty = container.resolve<LoyaltyService>("loyalty")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)

  const cards = (await loyalty.listGiftCards({ reference: "order", created_at: { $gte: since } }, { take: 200 })).filter((c) => !c.metadata?.code_emailed_at)
  if (!cards.length) {
    return
  }

  const orderIds = [...new Set(cards.map((c) => c.reference_id).filter((id): id is string => !!id))]
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "email", "display_id", "shipping_address.first_name", "billing_address.first_name", "items.id", "items.metadata"],
    filters: { id: orderIds },
  })

  for (const card of cards) {
    const order = orders.find((o) => o.id === card.reference_id)
    if (!order?.email) {
      continue
    }
    const meta = (order.items ?? []).find((i) => i?.id === card.line_item_id)?.metadata ?? {}
    const recipient = typeof meta.gift_recipient_email === "string" && meta.gift_recipient_email ? meta.gift_recipient_email : order.email
    const sender = order.billing_address?.first_name || order.shipping_address?.first_name || undefined
    await sendEmail(container, {
      to: recipient,
      template: "gift-card",
      idempotencyKey: `gift-card:${card.id}`,
      resourceId: card.id,
      resourceType: "gift_card",
      data: {
        code: card.code,
        amount: formatMoney(card.value, card.currency_code),
        recipient_name: typeof meta.gift_recipient_name === "string" ? meta.gift_recipient_name : undefined,
        sender_name: recipient === order.email ? undefined : sender,
        message: typeof meta.gift_message === "string" ? meta.gift_message : undefined,
        shop_url: STOREFRONT_URL,
      },
    })
    await loyalty.updateGiftCards([{ id: card.id, metadata: { ...(card.metadata ?? {}), code_emailed_at: new Date().toISOString(), code_emailed_to: recipient } }])
  }
}

export const config = { name: "send-gift-card-codes", schedule: "* * * * *" }

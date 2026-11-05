import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

// The loyalty plugin issues gift card codes as soon as the order is placed, so
// cash on delivery would hand out a usable code before anyone has paid.
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const { data } = await container.resolve(ContainerRegistrationKeys.QUERY).graph({
    entity: "cart",
    fields: ["id", "items.product.is_giftcard", "payment_collection.payment_sessions.provider_id"],
    filters: { id: cart.id },
  })
  const c = data[0]
  const hasGiftCard = (c?.items ?? []).some((i) => i?.product?.is_giftcard)
  const cod = (c?.payment_collection?.payment_sessions ?? []).some((s) => s?.provider_id === "pp_system_default")
  if (hasGiftCard && cod) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Gift cards can't be paid cash on delivery. Choose UPI, card or PhonePe.")
  }
})

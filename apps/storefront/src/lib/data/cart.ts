"use server"

import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import type { ActionResult, Address, Bag, Silhouette, Tone } from "@/lib/types"
import { emptyBag } from "@/lib/types"
import { toBag, toMedusaAddress } from "./adapters"
import { getRegion } from "./catalog"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "./cookies"
import { demoCart } from "./mock-backend"
import { DEMO_MODE } from "./mode"

const CART_FIELDS =
  "*items,+items.metadata,+items.requires_shipping,*promotions,*shipping_methods,*shipping_address,*payment_collection,*payment_collection.payment_sessions,+completed_at,*gift_cards,+credit_line_total,*credit_lines"

function message(e: unknown, fallback = "Something went wrong. Please try again.") {
  return e instanceof Error && e.message ? e.message : fallback
}

async function fetchCart(id: string) {
  const { cart } = await sdk.store.cart.retrieve(id, { fields: CART_FIELDS }, await getAuthHeaders())
  return cart
}

/** Read the current cart without touching cookies (safe in Server Components). */
export async function readCart(): Promise<HttpTypes.StoreCart | null> {
  if (DEMO_MODE) return null
  const id = await getCartId()
  if (!id) return null
  try {
    const cart = await fetchCart(id)
    return cart.completed_at ? null : cart
  } catch {
    return null
  }
}

/** Current bag for Server Components (no cookie writes). */
export async function readBag(): Promise<Bag> {
  if (DEMO_MODE) return demoCart.read()
  return toBag(await readCart())
}

export async function getBag(): Promise<Bag> {
  if (DEMO_MODE) return demoCart.read()
  const id = await getCartId()
  if (!id) return emptyBag
  try {
    const cart = await fetchCart(id)
    if (cart.completed_at) {
      await removeCartId()
      return emptyBag
    }
    return toBag(cart)
  } catch {
    await removeCartId()
    return emptyBag
  }
}

async function ensureCartId() {
  const existing = await getCartId()
  if (existing) return existing
  const region = await getRegion()
  const { cart } = await sdk.store.cart.create({ region_id: region.id }, { fields: "id" }, await getAuthHeaders())
  await setCartId(cart.id)
  return cart.id
}

export type GiftCardDetails = { recipientEmail?: string; recipientName?: string; message?: string }

export async function addToBag(
  variantId: string,
  quantity: number,
  display: { tone: Tone; silhouette: Silhouette },
  gift?: GiftCardDetails
): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.add(variantId, quantity)
  try {
    const cartId = await ensureCartId()
    const giftMeta = gift
      ? {
          gift_card: true,
          ...(gift.recipientEmail ? { gift_recipient_email: gift.recipientEmail.trim().toLowerCase() } : {}),
          ...(gift.recipientName ? { gift_recipient_name: gift.recipientName.trim().slice(0, 80) } : {}),
          ...(gift.message ? { gift_message: gift.message.trim().slice(0, 300) } : {}),
        }
      : {}
    const { cart } = await sdk.store.cart.createLineItem(
      cartId,
      { variant_id: variantId, quantity, metadata: { tone: [...display.tone], silhouette: display.silhouette, ...giftMeta } },
      { fields: CART_FIELDS },
      await getAuthHeaders()
    )
    return { ok: true, data: toBag(cart) }
  } catch (e) {
    return { ok: false, error: message(e, "Could not add to bag") }
  }
}

export async function updateBagLine(lineId: string, quantity: number): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.update(lineId, quantity)
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const headers = await getAuthHeaders()
    if (quantity <= 0) {
      await sdk.store.cart.deleteLineItem(cartId, lineId, {}, headers)
      return { ok: true, data: toBag(await fetchCart(cartId)) }
    }
    const { cart } = await sdk.store.cart.updateLineItem(cartId, lineId, { quantity }, { fields: CART_FIELDS }, headers)
    return { ok: true, data: toBag(cart) }
  } catch (e) {
    return { ok: false, error: message(e, "Could not update quantity") }
  }
}

export async function applyPromoCode(code: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.applyPromo(code)
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const { cart } = await sdk.store.cart.addPromotions(cartId, { promo_codes: [code] }, { fields: CART_FIELDS }, await getAuthHeaders())
    const applied = (cart.promotions ?? []).some((p) => p.code?.toUpperCase() === code.toUpperCase())
    if (!applied) return { ok: false, error: "That code is not valid" }
    return { ok: true, data: toBag(cart) }
  } catch {
    return { ok: false, error: "That code is not valid" }
  }
}

export async function removePromoCode(code: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.removePromo()
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const { cart } = await sdk.store.cart.removePromotions(cartId, { promo_codes: [code] }, { fields: CART_FIELDS }, await getAuthHeaders())
    return { ok: true, data: toBag(cart) }
  } catch (e) {
    return { ok: false, error: message(e) }
  }
}

/** Gift card codes (loyalty plugin route POST/DELETE /store/carts/:id/gift-cards). */
export async function applyGiftCard(code: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return { ok: false, error: "Gift cards are not available in the demo store" }
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    await sdk.client.fetch(`/store/carts/${cartId}/gift-cards`, { method: "POST", body: { code: code.trim().toUpperCase() }, headers: await getAuthHeaders() })
    return { ok: true, data: toBag(await fetchCart(cartId)) }
  } catch (e) {
    const msg = message(e, "")
    return { ok: false, error: /not found/i.test(msg) || !msg ? "That gift card code is not valid" : msg }
  }
}

export async function removeGiftCard(code: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return { ok: false, error: "Gift cards are not available in the demo store" }
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    await sdk.client.fetch(`/store/carts/${cartId}/gift-cards`, { method: "DELETE", body: { code }, headers: await getAuthHeaders() })
    return { ok: true, data: toBag(await fetchCart(cartId)) }
  } catch (e) {
    return { ok: false, error: message(e) }
  }
}

/** Signed-in customers only. Amount 0 removes it: the plugin replaces the store credit line each time. */
export async function setStoreCredit(use: boolean): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return { ok: false, error: "Store credit is not available in the demo store" }
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    await sdk.client.fetch(`/store/carts/${cartId}/store-credits`, { method: "POST", body: use ? {} : { amount: 0 }, headers: await getAuthHeaders() })
    return { ok: true, data: toBag(await fetchCart(cartId)) }
  } catch (e) {
    return { ok: false, error: message(e, "Could not apply store credit") }
  }
}

export async function getStoreCreditBalance(currency = "inr"): Promise<number> {
  if (DEMO_MODE) return 0
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return 0
  try {
    const res = await sdk.client.fetch<{ store_credit_accounts: { balance: number }[] }>("/store/store-credit-accounts", { query: { currency_code: currency }, headers })
    return res.store_credit_accounts.reduce((sum, a) => sum + Number(a.balance ?? 0), 0)
  } catch {
    return 0
  }
}

export type ShippingChoice = { id: string; label: string; description: string; price: number }

export async function setCheckoutContact(input: {
  email: string
  address: Omit<Address, "id" | "isDefault" | "label">
}): Promise<ActionResult<{ bag: Bag; shipping: ShippingChoice[] }>> {
  if (DEMO_MODE) return demoCart.setContact(input.email, input.address)
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const headers = await getAuthHeaders()
    const address = toMedusaAddress(input.address)
    const { cart } = await sdk.store.cart.update(
      cartId,
      { email: input.email, shipping_address: address, billing_address: address },
      { fields: CART_FIELDS },
      headers
    )
    const { shipping_options } = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId }, headers)
    const shipping = shipping_options.map((o) => ({
      id: o.id,
      label: o.name,
      description: o.type?.description ?? "",
      price: o.amount ?? 0,
    }))
    return { ok: true, data: { bag: toBag(cart), shipping } }
  } catch (e) {
    return { ok: false, error: message(e, "Could not save your address") }
  }
}

export async function setShippingMethod(optionId: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.setShipping(optionId)
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const { cart } = await sdk.store.cart.addShippingMethod(cartId, { option_id: optionId }, { fields: CART_FIELDS }, await getAuthHeaders())
    return { ok: true, data: toBag(cart) }
  } catch (e) {
    return { ok: false, error: message(e, "Could not set delivery method") }
  }
}

export type PaymentStart =
  | { kind: "razorpay"; keyId: string; orderId: string; amount: number; currency: string }
  | { kind: "redirect"; url: string }
  | { kind: "none" }

const PROVIDER_FOR_METHOD: Record<string, string> = {
  upi: "pp_razorpay_razorpay",
  card: "pp_razorpay_razorpay",
  phonepe: "pp_phonepe_phonepe",
  cod: "pp_system_default",
}

function paymentStart(providerId: string, data: Record<string, unknown> | undefined): PaymentStart {
  if (providerId.startsWith("pp_razorpay") && typeof data?.razorpay_order_id === "string") {
    return {
      kind: "razorpay",
      keyId: String(data.key_id ?? ""),
      orderId: data.razorpay_order_id,
      amount: Number(data.amount ?? 0),
      currency: String(data.currency ?? "INR"),
    }
  }
  if (providerId.startsWith("pp_phonepe") && typeof data?.redirect_url === "string") {
    return { kind: "redirect", url: data.redirect_url }
  }
  return { kind: "none" }
}

/** Opens a payment session with the gateway behind the chosen method (Razorpay, PhonePe, or system for COD). */
export async function setPaymentMethod(method: string): Promise<ActionResult<{ bag: Bag; payment: PaymentStart }>> {
  if (DEMO_MODE) {
    const res = await demoCart.setPayment(method)
    return res.ok ? { ok: true, data: { bag: res.data, payment: { kind: "none" } } } : res
  }
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const headers = await getAuthHeaders()
    const region = await getRegion()
    // Gift cards or store credit cover everything: Medusa completes the cart without a payment session.
    const covered = ((await fetchCart(cartId)).total ?? 0) <= 0
    const { cart } = await sdk.store.cart.update(cartId, { metadata: { payment_method: covered ? "gift_card" : method } }, { fields: CART_FIELDS }, headers)
    if (covered) return { ok: true, data: { bag: toBag(cart), payment: { kind: "none" } } }
    const { payment_providers } = await sdk.store.payment.listPaymentProviders({ region_id: region.id }, headers)
    const wanted = PROVIDER_FOR_METHOD[method]
    const provider = payment_providers.find((p) => p.id === wanted)?.id
    if (!provider) return { ok: false, error: "That payment method is not available right now" }
    const { payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, { provider_id: provider }, {}, headers)
    const session = payment_collection.payment_sessions?.find((s) => s.provider_id === provider)
    return { ok: true, data: { bag: toBag(await fetchCart(cartId)), payment: paymentStart(provider, session?.data) } }
  } catch (e) {
    return { ok: false, error: message(e, "Could not set payment method") }
  }
}

export async function placeOrder(): Promise<ActionResult<{ orderId: string }>> {
  if (DEMO_MODE) return demoCart.complete()
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const result = await sdk.store.cart.complete(cartId, {}, await getAuthHeaders())
    if (result.type === "order") {
      await removeCartId()
      return { ok: true, data: { orderId: result.order.id } }
    }
    return { ok: false, error: result.error?.message ?? "Could not place the order" }
  } catch (e) {
    return { ok: false, error: message(e, "Could not place the order") }
  }
}

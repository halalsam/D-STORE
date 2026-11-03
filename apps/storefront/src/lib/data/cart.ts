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
  "*items,+items.metadata,*promotions,*shipping_methods,*shipping_address,*payment_collection,*payment_collection.payment_sessions,+completed_at"

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

export async function addToBag(
  variantId: string,
  quantity: number,
  display: { tone: Tone; silhouette: Silhouette }
): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.add(variantId, quantity)
  try {
    const cartId = await ensureCartId()
    const { cart } = await sdk.store.cart.createLineItem(
      cartId,
      { variant_id: variantId, quantity, metadata: { tone: [...display.tone], silhouette: display.silhouette } },
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
      description: (o as { type?: { description?: string } }).type?.description ?? "",
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

/**
 * Records the chosen method (UPI / card / COD) on the cart and opens a
 * payment session. All methods use the region's first provider until a
 * real gateway (Razorpay, Stripe) is installed in the backend.
 */
export async function setPaymentMethod(method: string, upiId?: string): Promise<ActionResult<Bag>> {
  if (DEMO_MODE) return demoCart.setPayment(method, upiId)
  const cartId = await getCartId()
  if (!cartId) return { ok: false, error: "Your bag has expired" }
  try {
    const headers = await getAuthHeaders()
    const region = await getRegion()
    const { cart } = await sdk.store.cart.update(
      cartId,
      { metadata: { payment_method: method, ...(upiId ? { upi_id: upiId } : {}) } },
      { fields: CART_FIELDS },
      headers
    )
    const { payment_providers } = await sdk.store.payment.listPaymentProviders({ region_id: region.id }, headers)
    const provider = payment_providers[0]?.id
    if (!provider) return { ok: false, error: "No payment provider is set up for this region" }
    await sdk.store.payment.initiatePaymentSession(cart, { provider_id: provider }, {}, headers)
    return { ok: true, data: toBag(await fetchCart(cartId)) }
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

"use server"

import { revalidatePath } from "next/cache"
import { sdk } from "@/lib/medusa"
import type { ActionResult, Address, Customer, Order } from "@/lib/types"
import { toCustomer, toCustomerAddress, toMedusaAddress, toOrder, type PaymentChoice } from "./adapters"
import { getAuthHeaders, getCartId, removeAuthToken, setAuthToken } from "./cookies"
import { demoCustomer } from "./mock-backend"
import { DEMO_MODE } from "./mode"

const ORDER_FIELDS =
  "*items,+items.metadata,*shipping_address,*shipping_methods,*fulfillments,*fulfillments.labels,+item_subtotal,+discount_total,+shipping_total,+total"

function message(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback
}

export type Session = { customer: Customer; addresses: Address[] } | null

/** Current customer from the auth cookie, or null. Not cached (per user). */
export async function getSession(): Promise<Session> {
  if (DEMO_MODE) return demoCustomer.session()
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return null
  try {
    const { customer } = await sdk.store.customer.retrieve({ fields: "*addresses" }, headers)
    const addresses = (customer.addresses ?? []).map(toCustomerAddress)
    addresses.sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault))
    return { customer: toCustomer(customer), addresses }
  } catch {
    return null
  }
}

async function attachCart() {
  const cartId = await getCartId()
  if (!cartId) return
  try {
    await sdk.store.cart.transferCart(cartId, {}, await getAuthHeaders())
  } catch {
    // Cart may belong to someone else or be completed; ignore.
  }
}

export async function signIn(email: string, password: string): Promise<ActionResult> {
  if (DEMO_MODE) return demoCustomer.signIn(email, password)
  try {
    const token = await sdk.auth.login("customer", "emailpass", { email, password })
    if (typeof token !== "string") return { ok: false, error: "Additional verification is required" }
    await setAuthToken(token)
    await attachCart()
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: "Email or password is incorrect" }
  }
}

export async function signUp(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  marketing: boolean
}): Promise<ActionResult> {
  if (DEMO_MODE) return demoCustomer.signIn(input.email, input.password, input)
  try {
    const registration = await sdk.auth.register("customer", "emailpass", { email: input.email, password: input.password })
    await sdk.store.customer.create(
      { email: input.email, first_name: input.firstName, last_name: input.lastName, metadata: { marketing: input.marketing } },
      {},
      { authorization: `Bearer ${registration}` }
    )
    return await signIn(input.email, input.password)
  } catch (e) {
    const msg = message(e, "Could not create your account")
    return { ok: false, error: /exist/i.test(msg) ? "An account with this email already exists. Sign in instead." : msg }
  }
}

export async function signOut() {
  if (DEMO_MODE) {
    await demoCustomer.signOut()
    revalidatePath("/", "layout")
    return
  }
  await removeAuthToken()
  revalidatePath("/", "layout")
}

export async function updateProfile(input: Partial<Pick<Customer, "firstName" | "lastName" | "phone" | "marketing" | "orderUpdatesSms">>): Promise<ActionResult> {
  if (DEMO_MODE) return demoCustomer.update(input)
  try {
    const headers = await getAuthHeaders()
    const { customer } = await sdk.store.customer.retrieve({ fields: "metadata" }, headers)
    await sdk.store.customer.update(
      {
        ...(input.firstName !== undefined ? { first_name: input.firstName } : {}),
        ...(input.lastName !== undefined ? { last_name: input.lastName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        metadata: {
          ...(customer.metadata ?? {}),
          ...(input.marketing !== undefined ? { marketing: input.marketing } : {}),
          ...(input.orderUpdatesSms !== undefined ? { order_updates_sms: input.orderUpdatesSms } : {}),
        },
      },
      {},
      headers
    )
    revalidatePath("/account", "layout")
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: message(e, "Could not save your details") }
  }
}

export async function saveAddress(address: Address, isNew: boolean): Promise<ActionResult<{ id: string }>> {
  if (DEMO_MODE) {
    const res = await demoCustomer.saveAddress(address, isNew)
    revalidatePath("/account", "layout")
    return res
  }
  try {
    const headers = await getAuthHeaders()
    const body = {
      ...toMedusaAddress(address),
      address_name: address.label ?? null,
      is_default_shipping: !!address.isDefault,
      is_default_billing: !!address.isDefault,
    }
    const { customer } = isNew
      ? await sdk.store.customer.createAddress(body, { fields: "*addresses" }, headers)
      : await sdk.store.customer.updateAddress(address.id, body, { fields: "*addresses" }, headers)
    const saved = isNew
      ? [...(customer.addresses ?? [])].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0]
      : customer.addresses?.find((a) => a.id === address.id)
    revalidatePath("/account", "layout")
    return { ok: true, data: { id: saved?.id ?? address.id } }
  } catch (e) {
    return { ok: false, error: message(e, "Could not save the address") }
  }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  if (DEMO_MODE) {
    const res = await demoCustomer.deleteAddress(id)
    revalidatePath("/account", "layout")
    return res
  }
  try {
    await sdk.store.customer.deleteAddress(id, await getAuthHeaders())
    revalidatePath("/account", "layout")
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: message(e, "Could not remove the address") }
  }
}

export async function listOrders(): Promise<Order[]> {
  if (DEMO_MODE) return (await demoCustomer.session()) ? demoCustomer.orders() : []
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return []
  try {
    const { orders } = await sdk.store.order.list({ fields: ORDER_FIELDS, order: "-created_at", limit: 50 }, headers)
    return orders.map((o) => toOrder(o))
  } catch {
    return []
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  if (DEMO_MODE) return demoCustomer.order(id)
  try {
    const headers = await getAuthHeaders()
    const [{ order }, payment] = await Promise.all([
      sdk.store.order.retrieve(id, { fields: ORDER_FIELDS }, headers),
      // Custom backend route (apps/backend/src/api/store/orders/[id]/payment-method).
      sdk.client.fetch<PaymentChoice>(`/store/orders/${id}/payment-method`, { headers }).catch(() => undefined),
    ])
    return toOrder(order, payment)
  } catch {
    return null
  }
}

/** Starts Medusa's reset flow (emits auth.password_reset; needs a notification provider to send the email). */
export async function requestPasswordReset(email: string): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: true, data: undefined }
  try {
    await sdk.auth.resetPassword("customer", "emailpass", { identifier: email })
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: message(e, "Could not start the reset") }
  }
}

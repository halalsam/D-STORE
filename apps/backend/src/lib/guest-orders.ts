import { createHmac, timingSafeEqual } from "node:crypto"
import type { CustomerDTO, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateCustomersWorkflow } from "@medusajs/medusa/core-flows"
import { linkOrderToCustomerWorkflow } from "../workflows/link-order-to-customer"
import { sendEmail, STOREFRONT_URL } from "./notify"

/**
 * Guest checkouts create a separate guest customer (has_account: false) even
 * when an account with that email exists, so their orders never show up in the
 * account. Orders are linked to an account only once the account has proven it
 * owns the email, otherwise anyone could sign up with someone else's address
 * and read their order history.
 */

export const EMAIL_VERIFIED_KEY = "email_verified_at"

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 3

type Customer = Pick<CustomerDTO, "id" | "email" | "first_name" | "has_account" | "metadata">

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

export function isEmailVerified(customer: Pick<CustomerDTO, "metadata">) {
  return typeof customer.metadata?.[EMAIL_VERIFIED_KEY] === "string"
}

function sign(body: string) {
  return createHmac("sha256", `email-verification:${process.env.JWT_SECRET || "supersecret"}`).update(body).digest("base64url")
}

export function createVerificationToken(customer: Pick<CustomerDTO, "id" | "email">) {
  const body = Buffer.from(JSON.stringify({ c: customer.id, e: normalizeEmail(customer.email), x: Date.now() + TOKEN_TTL_MS })).toString("base64url")
  return `${body}.${sign(body)}`
}

export function readVerificationToken(token: string): { customerId: string; email: string } | null {
  const [body, mac] = token.split(".")
  if (!body || !mac) {
    return null
  }
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { c?: unknown; e?: unknown; x?: unknown }
    if (typeof payload.c !== "string" || typeof payload.e !== "string" || typeof payload.x !== "number" || payload.x < Date.now()) {
      return null
    }
    return { customerId: payload.c, email: payload.e }
  } catch {
    return null
  }
}

export async function sendVerificationEmail(container: MedusaContainer, customer: Customer, opts: { reason: "signup" | "guest-order"; idempotencyKey: string }) {
  const token = createVerificationToken(customer)
  await sendEmail(container, {
    to: customer.email,
    template: "verify-email",
    idempotencyKey: opts.idempotencyKey,
    resourceId: customer.id,
    resourceType: "customer",
    data: { first_name: customer.first_name ?? undefined, verify_url: `${STOREFRONT_URL}/verify-email?token=${encodeURIComponent(token)}`, reason: opts.reason },
  })
}

export async function markEmailVerified(container: MedusaContainer, customer: Customer) {
  if (isEmailVerified(customer)) {
    return
  }
  await updateCustomersWorkflow(container).run({
    input: { selector: { id: customer.id }, update: { metadata: { [EMAIL_VERIFIED_KEY]: new Date().toISOString() } } },
  })
}

/** Registered account for this email, if there is one. */
export async function findAccountByEmail(container: MedusaContainer, email: string): Promise<Customer | undefined> {
  const variants = [...new Set([email, normalizeEmail(email)])]
  const [account] = await container.resolve(Modules.CUSTOMER).listCustomers({ email: variants, has_account: true })
  return account
}

/**
 * Moves orders placed as a guest with the account's email into the account.
 * Pass orderIds to limit it to specific orders. Returns how many were linked.
 */
export async function linkGuestOrders(container: MedusaContainer, account: Customer, orderIds?: string[]) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const variants = [...new Set([account.email, normalizeEmail(account.email)])]

  const guests = await container.resolve(Modules.CUSTOMER).listCustomers({ email: variants, has_account: false }, { select: ["id"] })
  if (!guests.length) {
    return 0
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id"],
    filters: { customer_id: guests.map((g) => g.id), ...(orderIds?.length ? { id: orderIds } : {}) },
  })

  let linked = 0
  for (const order of orders) {
    try {
      await linkOrderToCustomerWorkflow(container).run({ input: { order_id: order.id, customer_id: account.id } })
      linked++
    } catch (e) {
      logger.warn(`Could not link order ${order.id} to customer ${account.id}: ${(e as Error).message}`)
    }
  }
  return linked
}

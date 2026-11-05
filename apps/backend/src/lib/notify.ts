import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { Resend } from "resend"

export const STOREFRONT_URL = (process.env.STOREFRONT_URL ?? "http://localhost:8000").replace(/\/$/, "")

export function formatMoney(amount: unknown, currency = "inr") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 2 }).format(Number(amount ?? 0))
}

export async function sendEmail(
  container: MedusaContainer,
  input: { to: string; template: string; data: Record<string, unknown>; idempotencyKey?: string; resourceId?: string; resourceType?: string }
) {
  const notifications = container.resolve(Modules.NOTIFICATION)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await notifications.createNotifications({
      to: input.to,
      channel: "email",
      template: input.template,
      data: input.data,
      idempotency_key: input.idempotencyKey,
      resource_id: input.resourceId,
      resource_type: input.resourceType,
    })
  } catch (e) {
    logger.error(`Email "${input.template}" to ${input.to} failed: ${(e as Error).message}`)
  }
}

let resend: Resend | undefined

/** Upserts a Resend contact so marketing lists follow customer consent. No-op without RESEND_API_KEY. */
export async function syncResendContact(
  container: MedusaContainer,
  contact: { email: string; firstName?: string | null; lastName?: string | null; subscribed: boolean }
) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return
  }
  resend ??= new Resend(apiKey)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await upsertContact(resend, contact)
  } catch (e) {
    logger.warn(`Resend contact sync failed for ${contact.email}: ${(e as Error).message}`)
  }
}

async function upsertContact(
  client: Resend,
  contact: { email: string; firstName?: string | null; lastName?: string | null; subscribed: boolean }
) {
  const segmentId = process.env.RESEND_SEGMENT_ID
  const update = await client.contacts.update({
    email: contact.email,
    unsubscribed: !contact.subscribed,
    firstName: contact.firstName ?? null,
    lastName: contact.lastName ?? null,
  })
  if (!update.error) {
    return
  }
  const created = await client.contacts.create({
    email: contact.email,
    unsubscribed: !contact.subscribed,
    firstName: contact.firstName ?? undefined,
    lastName: contact.lastName ?? undefined,
    ...(segmentId ? { segments: [{ id: segmentId }] } : {}),
  })
  if (created.error) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, created.error.message)
  }
}

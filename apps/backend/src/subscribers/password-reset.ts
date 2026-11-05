import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendEmail, STOREFRONT_URL } from "../lib/notify"

export default async function passwordReset({
  event,
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const { entity_id: email, token, actor_type } = event.data
  const base = actor_type === "customer" ? `${STOREFRONT_URL}/reset-password` : `${process.env.MEDUSA_BACKEND_URL ?? ""}/app/reset-password`
  await sendEmail(container, {
    to: email,
    template: "password-reset",
    data: { reset_url: `${base}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}` },
  })
}

export const config: SubscriberConfig = { event: "auth.password_reset" }

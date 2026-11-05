import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { sendEmail, STOREFRONT_URL, syncResendContact } from "../../../lib/notify"

export const NewsletterSignup = z.object({ email: z.string().email().max(254) })

export const POST = async (req: MedusaRequest<z.infer<typeof NewsletterSignup>>, res: MedusaResponse) => {
  const email = req.validatedBody.email.toLowerCase()
  await syncResendContact(req.scope, { email, subscribed: true })
  await sendEmail(req.scope, {
    to: email,
    template: "newsletter-welcome",
    idempotencyKey: `newsletter-welcome:${email}`,
    data: { shop_url: `${STOREFRONT_URL}/collections/new-arrivals`, code: process.env.NEWSLETTER_PROMO_CODE || undefined },
  })
  res.json({ subscribed: true })
}

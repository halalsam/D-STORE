"use server"

import { sdk } from "@/lib/medusa"
import type { ActionResult } from "@/lib/types"
import { DEMO_MODE } from "./mode"

export async function subscribeNewsletter(email: string): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: true, data: undefined }
  try {
    await sdk.client.fetch("/store/newsletter", { method: "POST", body: { email } })
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: "Could not subscribe. Check the email and try again." }
  }
}

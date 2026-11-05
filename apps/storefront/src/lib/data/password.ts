"use server"

import { sdk } from "@/lib/medusa"
import type { ActionResult } from "@/lib/types"
import { DEMO_MODE } from "./mode"

export async function resetPassword(input: { email: string; token: string; password: string }): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: true, data: undefined }
  try {
    await sdk.auth.updateProvider("customer", "emailpass", { email: input.email, password: input.password }, input.token)
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: "This reset link has expired. Request a new one from the sign-in page." }
  }
}

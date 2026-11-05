"use server"

import { sdk } from "@/lib/medusa"
import type { ActionResult } from "@/lib/types"
import { getAuthHeaders } from "./cookies"
import { DEMO_MODE } from "./mode"

/** Back-in-stock alert (custom route apps/backend/src/api/store/restock-subscriptions). */
export async function subscribeRestock(variantId: string, email: string): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: true, data: undefined }
  try {
    await sdk.client.fetch("/store/restock-subscriptions", { method: "POST", body: { variant_id: variantId, email: email.trim() }, headers: await getAuthHeaders() })
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.message ? e.message : "Could not save your alert" }
  }
}

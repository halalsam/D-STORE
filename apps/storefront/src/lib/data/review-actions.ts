"use server"

import { sdk } from "@/lib/medusa"
import type { ActionResult, ReviewEligibility } from "@/lib/types"
import { getAuthHeaders } from "./cookies"
import { DEMO_MODE } from "./mode"

type MyReview = { product_id: string; order_id: string; order_line_item_id: string; rating: number; content: string | null; status: "pending" | "approved" | "flagged"; images?: { url: string }[] }

function message(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback
}

/** Reviews are tied to an order line, so only shoppers who bought the product can write one. */
export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  if (DEMO_MODE) return { kind: "signed-out" }
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return { kind: "signed-out" }
  try {
    const [{ orders }, mine] = await Promise.all([
      sdk.store.order.list({ fields: "id,status,created_at,*items", order: "-created_at", limit: 50 }, headers),
      sdk.client.fetch<{ product_reviews: MyReview[] }>("/store/customers/me/product-reviews", { headers }),
    ])
    const existing = mine.product_reviews.find((r) => r.product_id === productId)
    if (existing) {
      return {
        kind: "can-review",
        orderId: existing.order_id,
        lineId: existing.order_line_item_id,
        existing: { rating: existing.rating, content: existing.content ?? "", status: existing.status, images: [...new Set((existing.images ?? []).map((i) => i.url))] },
      }
    }
    for (const order of orders) {
      if (order.status === "canceled") continue
      const line = order.items?.find((i) => i.product_id === productId)
      if (line) return { kind: "can-review", orderId: order.id, lineId: line.id }
    }
    return { kind: "not-purchased" }
  } catch {
    return { kind: "signed-out" }
  }
}

export async function submitReview(input: { orderId: string; lineId: string; rating: number; content: string; images: string[] }): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: false, error: "Reviews are not available in the demo store" }
  if (!(input.rating >= 1 && input.rating <= 5)) return { ok: false, error: "Choose a rating" }
  try {
    await sdk.client.fetch("/store/product-reviews", {
      method: "POST",
      headers: await getAuthHeaders(),
      body: {
        reviews: [
          {
            order_id: input.orderId,
            order_line_item_id: input.lineId,
            rating: Math.round(input.rating),
            content: input.content.trim().slice(0, 2000),
            images: input.images.slice(0, 4).map((url) => ({ url })),
          },
        ],
      },
    })
    return { ok: true, data: undefined }
  } catch (e) {
    return { ok: false, error: message(e, "Could not save your review") }
  }
}

/** One photo per call, already downscaled in the browser to stay under the server action body limit. */
export async function uploadReviewPhoto(form: FormData): Promise<ActionResult<{ url: string }>> {
  if (DEMO_MODE) return { ok: false, error: "Photos are not available in the demo store" }
  try {
    const res = await sdk.client.fetch<{ files: { url: string }[] }>("/store/product-reviews/uploads", {
      method: "POST",
      body: form,
      headers: { ...(await getAuthHeaders()), "content-type": null } as unknown as Record<string, string>,
    })
    const url = res.files[0]?.url
    return url ? { ok: true, data: { url } } : { ok: false, error: "Upload failed" }
  } catch (e) {
    return { ok: false, error: message(e, "Could not upload the photo") }
  }
}

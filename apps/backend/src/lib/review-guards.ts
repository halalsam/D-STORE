import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/**
 * Guards for the @lambdacurry/medusa-product-reviews store routes, which
 * accept anonymous writes as shipped.
 */

export const REVIEW_PHOTO_LIMITS = { files: 4, fileBytes: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] }

/** Only the customer who placed the order can review its items, and not on cancelled orders. */
export function requireOwnOrders(req: AuthenticatedMedusaRequest<{ reviews?: { order_id: string }[] }>, _res: MedusaResponse, next: MedusaNextFunction) {
  const orderIds = [...new Set((req.validatedBody?.reviews ?? []).map((r) => r.order_id))]
  if (!orderIds.length) {
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, "No reviews to save"))
  }
  req.scope
    .resolve(ContainerRegistrationKeys.QUERY)
    .graph({ entity: "order", fields: ["id", "customer_id", "status"], filters: { id: orderIds } })
    .then(({ data: orders }) => {
      const owned = orders.filter((o) => o.customer_id === req.auth_context.actor_id && o.status !== "canceled")
      next(owned.length === orderIds.length ? undefined : new MedusaError(MedusaError.Types.NOT_ALLOWED, "You can only review items from your own orders"))
    })
    .catch(next)
}

/** The public list must never expose pending or flagged reviews, whatever the query asks for. */
export function onlyApprovedReviews(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  req.filterableFields = { ...req.filterableFields, status: "approved" }
  next()
}

/** Runs before the plugin's multer parses the body, so oversized uploads are refused without buffering them. */
export function limitReviewPhotoRequest(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  if (req.method !== "POST") {
    return next()
  }
  const length = Number(req.headers["content-length"] ?? NaN)
  if (!Number.isFinite(length) || length > REVIEW_PHOTO_LIMITS.files * REVIEW_PHOTO_LIMITS.fileBytes + 64 * 1024) {
    return next(new MedusaError(MedusaError.Types.NOT_ALLOWED, "Upload up to 4 photos of 5 MB each"))
  }
  next()
}

/** Runs after multer: checks each parsed file before the plugin stores it. */
export function checkReviewPhotos(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  const files = ((req as unknown as { files?: { mimetype: string; size: number }[] }).files ?? [])
  const bad = files.length > REVIEW_PHOTO_LIMITS.files || files.some((f) => !REVIEW_PHOTO_LIMITS.types.includes(f.mimetype) || f.size > REVIEW_PHOTO_LIMITS.fileBytes)
  if (bad) {
    return next(new MedusaError(MedusaError.Types.INVALID_DATA, "Upload up to 4 JPEG, PNG or WebP photos of 5 MB each"))
  }
  next()
}

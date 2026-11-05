import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { EMAIL_VERIFIED_KEY } from "../lib/guest-orders"
import { LinkGuestOrders } from "./store/customers/me/guest-orders/route"
import { VerifyEmail } from "./store/email-verification/route"
import { NewsletterSignup } from "./store/newsletter/route"

/** Customers can write their own metadata, so they must not be able to mark their email as verified. */
function stripVerifiedFlag(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  for (const body of [req.body, req.validatedBody] as { metadata?: Record<string, unknown> | null }[]) {
    if (body?.metadata && typeof body.metadata === "object") {
      delete body.metadata[EMAIL_VERIFIED_KEY]
    }
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/store/newsletter",
      middlewares: [validateAndTransformBody(NewsletterSignup)],
    },
    {
      method: ["POST"],
      matcher: "/store/customers",
      middlewares: [stripVerifiedFlag],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me",
      middlewares: [stripVerifiedFlag],
    },
    {
      method: ["POST"],
      matcher: "/store/email-verification",
      middlewares: [validateAndTransformBody(VerifyEmail)],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/email-verification",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/guest-orders",
      middlewares: [authenticate("customer", ["session", "bearer"]), validateAndTransformBody(LinkGuestOrders)],
    },
  ],
})

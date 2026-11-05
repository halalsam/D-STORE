import { configureStoreSearch, defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import { NewsletterSignup } from "./store/newsletter/route"

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
  ],
})

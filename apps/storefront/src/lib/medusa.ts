import Medusa from "@medusajs/js-sdk"

/**
 * Shared Medusa JS SDK client.
 * Store API calls will live in `src/lib/data/*` and go through this instance.
 */
export const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

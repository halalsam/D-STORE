import "server-only"
import Medusa from "@medusajs/js-sdk"

/**
 * Shared Medusa JS SDK client (server only). Every backend call in the
 * storefront goes through this instance: `sdk.store.*`, `sdk.auth.*`, or
 * `sdk.client.fetch` for custom routes. No raw fetch to the backend.
 * Tokens are never stored on this instance ("nostore"): per-request auth
 * headers come from cookies in src/lib/data/cookies.ts.
 */
export const sdk = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000",
  debug: false,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
})

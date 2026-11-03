import "server-only"
import Medusa from "@medusajs/js-sdk"

/**
 * Shared Medusa JS SDK client (server only).
 * Tokens are never stored on this instance ("nostore"): per-request auth
 * headers come from cookies in src/lib/data/cookies.ts.
 */
export const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: false,
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
})

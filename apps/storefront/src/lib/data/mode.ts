import "server-only"

/**
 * Demo mode: no Medusa backend configured. The storefront serves the
 * bundled D-STORE catalog and keeps cart / account state in cookies
 * (src/lib/data/mock-backend.ts). Set MEDUSA_BACKEND_URL to go live.
 */
export const DEMO_MODE = !process.env.MEDUSA_BACKEND_URL?.trim()

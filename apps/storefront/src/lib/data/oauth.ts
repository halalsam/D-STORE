"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { sdk } from "@/lib/medusa"
import type { ActionResult } from "@/lib/types"
import { OAUTH_NEXT_COOKIE } from "./cookies"
import { DEMO_MODE } from "./mode"


export async function startGoogleSignIn(next: string): Promise<ActionResult> {
  if (DEMO_MODE) return { ok: false, error: "Google sign-in is not available in the demo store" }
  let location: string | undefined
  try {
    const res = await sdk.auth.login("customer", "google", {})
    location = typeof res === "object" && "location" in res ? res.location : undefined
  } catch {
    return { ok: false, error: "Google sign-in is unavailable right now" }
  }
  if (!location) return { ok: false, error: "Google sign-in is unavailable right now" }
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account"
  ;(await cookies()).set(OAUTH_NEXT_COOKIE, safeNext, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 })
  redirect(location)
}

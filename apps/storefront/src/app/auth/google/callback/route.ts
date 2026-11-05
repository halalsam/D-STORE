import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { sdk } from "@/lib/medusa"
import { getCartId, OAUTH_NEXT_COOKIE, setAuthToken } from "@/lib/data/cookies"

type TokenPayload = { actor_id?: string; user_metadata?: { email?: string; given_name?: string; family_name?: string } }

function decode(token: string): TokenPayload {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))
  } catch {
    return {}
  }
}

export async function GET(req: NextRequest) {
  const jar = await cookies()
  const next = jar.get(OAUTH_NEXT_COOKIE)?.value ?? "/account"
  jar.delete(OAUTH_NEXT_COOKIE)
  const fail = () => NextResponse.redirect(new URL("/sign-in?error=google", req.url))

  try {
    const result = await sdk.auth.callback("customer", "google", Object.fromEntries(req.nextUrl.searchParams))
    if (typeof result !== "string") return fail()
    let token = result
    const payload = decode(token)

    // First Google sign-in: the auth identity exists but has no customer yet.
    if (!payload.actor_id) {
      const meta = payload.user_metadata ?? {}
      if (!meta.email) return fail()
      await sdk.store.customer.create(
        { email: meta.email, first_name: meta.given_name ?? "", last_name: meta.family_name ?? "" },
        {},
        { authorization: `Bearer ${token}` }
      )
      const refreshed = await sdk.auth.refresh({ authorization: `Bearer ${token}` })
      token = typeof refreshed === "string" ? refreshed : refreshed.token
    }

    await setAuthToken(token)
    const cartId = await getCartId()
    if (cartId) await sdk.store.cart.transferCart(cartId, {}, { authorization: `Bearer ${token}` }).catch(() => undefined)
    return NextResponse.redirect(new URL(next, req.url))
  } catch {
    return fail()
  }
}

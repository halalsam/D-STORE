import "server-only"
import { cookies } from "next/headers"

const AUTH = "_dstore_jwt"
const CART = "_dstore_cart_id"
const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" }

export async function getAuthHeaders(): Promise<{ authorization: string } | Record<string, never>> {
  const token = (await cookies()).get(AUTH)?.value
  return token ? { authorization: `Bearer ${token}` } : {}
}

export async function setAuthToken(token: string) {
  ;(await cookies()).set(AUTH, token, { ...base, maxAge: 60 * 60 * 24 * 7 })
}

export async function removeAuthToken() {
  ;(await cookies()).delete(AUTH)
}

export async function getCartId() {
  return (await cookies()).get(CART)?.value
}

export async function setCartId(id: string) {
  ;(await cookies()).set(CART, id, { ...base, maxAge: 60 * 60 * 24 * 30 })
}

export async function removeCartId() {
  ;(await cookies()).delete(CART)
}

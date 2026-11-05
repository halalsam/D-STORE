import { NextResponse, type NextRequest } from "next/server"
import { placeOrder } from "@/lib/data/cart"

// PhonePe sends the shopper back here; completing the cart asks the backend to verify the payment.
export async function GET(req: NextRequest) {
  const res = await placeOrder()
  const target = res.ok ? `/checkout/confirmed?order=${res.data.orderId}` : "/checkout?payment=failed"
  return NextResponse.redirect(new URL(target, req.url))
}

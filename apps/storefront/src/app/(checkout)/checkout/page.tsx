import type { Metadata } from "next"
import { Suspense } from "react"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"
import { toBag } from "@/lib/data/adapters"
import { readCart } from "@/lib/data/cart"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Checkout" }

async function Checkout() {
  const [cart, session] = await Promise.all([readCart(), currentSession()])
  return <CheckoutFlow initialBag={toBag(cart)} session={session} />
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-grid lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="grid gap-grid">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-panel skeleton" />)}</div>
          <div className="h-96 rounded-panel skeleton" />
        </div>
      }
    >
      <Checkout />
    </Suspense>
  )
}

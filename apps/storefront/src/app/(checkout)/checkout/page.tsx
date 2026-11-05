import type { Metadata } from "next"
import { Suspense } from "react"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"
import { getStoreCreditBalance, readBag } from "@/lib/data/cart"
import { DEMO_MODE } from "@/lib/data/mode"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Checkout" }

async function Checkout() {
  const [bag, session] = await Promise.all([readBag(), currentSession()])
  const storeCredit = session ? await getStoreCreditBalance(bag.currency) : 0
  return <CheckoutFlow initialBag={bag} session={session} demo={DEMO_MODE} storeCredit={storeCredit} />
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-tile lg:grid-cols-[minmax(0,1fr)_26rem]">
          <div className="grid gap-tile">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-panel skeleton" />)}</div>
          <div className="h-96 rounded-panel skeleton" />
        </div>
      }
    >
      <Checkout />
    </Suspense>
  )
}

import type { Metadata } from "next"
import { Suspense } from "react"
import { Confirmation } from "@/components/checkout/confirmation"

export const metadata: Metadata = { title: "Order confirmed" }

export default function ConfirmedPage() {
  return (
    <Suspense fallback={<div className="mx-auto h-[32rem] max-w-2xl rounded-panel skeleton" />}>
      <Confirmation />
    </Suspense>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Confirmation } from "@/components/checkout/confirmation"
import { Button } from "@/components/ui/button"
import { getOrder } from "@/lib/data/customer"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Order confirmed" }

async function Confirmed({ searchParams }: { searchParams: PageProps<"/checkout/confirmed">["searchParams"] }) {
  const { order: id } = await searchParams
  const [order, session] = await Promise.all([typeof id === "string" ? getOrder(id) : null, currentSession()])
  if (!order) {
    return (
      <div className="panel mx-auto max-w-lg py-14 text-center">
        <h1 className="type-heading-md">Order not found</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Check your email for the confirmation, or view your orders.</p>
        <Button asChild className="mt-6"><Link href="/account/orders">View orders</Link></Button>
      </div>
    )
  }
  return <Confirmation order={order} signedIn={!!session} />
}

export default function ConfirmedPage({ searchParams }: PageProps<"/checkout/confirmed">) {
  return (
    <Suspense fallback={<div className="mx-auto h-[32rem] max-w-2xl rounded-panel skeleton" />}>
      <Confirmed searchParams={searchParams} />
    </Suspense>
  )
}

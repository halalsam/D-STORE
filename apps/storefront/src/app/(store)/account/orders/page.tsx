import type { Metadata } from "next"
import { OrdersView } from "@/components/account/orders-view"
import { VerifyEmailNotice } from "@/components/account/verify-email-notice"
import { listOrders } from "@/lib/data/customer"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Orders" }

export default async function OrdersPage() {
  const [orders, session] = await Promise.all([listOrders(), currentSession()])
  const notice = session && !session.customer.emailVerified ? <VerifyEmailNotice email={session.customer.email} /> : null
  return <OrdersView orders={orders} notice={notice} />
}

import type { Metadata } from "next"
import { OrdersView } from "@/components/account/orders-view"
import { listOrders } from "@/lib/data/customer"

export const metadata: Metadata = { title: "Orders" }

export default async function OrdersPage() {
  return <OrdersView orders={await listOrders()} />
}

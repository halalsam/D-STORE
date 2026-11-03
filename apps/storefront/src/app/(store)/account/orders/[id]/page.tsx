import { OrderDetail } from "@/components/account/order-detail"
import { demoOrders } from "@/lib/mock/account"

export function generateStaticParams() {
  return demoOrders.map((o) => ({ id: o.id }))
}

export async function generateMetadata({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params
  return { title: `Order ${id}` }
}

export default async function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params
  return <OrderDetail id={id} />
}

import { EmptyCard } from "@/components/account/account-overview"
import { OrderDetail } from "@/components/account/order-detail"
import { PackageSearch } from "@/components/ui/icons"
import { getOrder } from "@/lib/data/customer"

export async function generateMetadata({ params }: PageProps<"/account/orders/[id]">) {
  await params
  return { title: "Order" }
}

export default async function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) {
    return <EmptyCard icon={<PackageSearch />} title="Order not found" body="We could not find this order on your account." href="/account/orders" cta="Back to orders" />
  }
  return <OrderDetail order={order} />
}

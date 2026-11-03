import { redirect } from "next/navigation"
import { AccountOverview } from "@/components/account/account-overview"
import { listProducts } from "@/lib/data/catalog"
import { listOrders } from "@/lib/data/customer"
import { currentSession } from "@/lib/data/session"

export default async function AccountPage() {
  const session = await currentSession()
  if (!session) redirect("/sign-in?next=/account")
  const [orders, products] = await Promise.all([listOrders(), listProducts()])
  return <AccountOverview customer={session.customer} addresses={session.addresses} orders={orders} products={products} />
}

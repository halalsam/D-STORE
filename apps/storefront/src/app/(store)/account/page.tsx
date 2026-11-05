import { redirect } from "next/navigation"
import { AccountOverview } from "@/components/account/account-overview"
import { StoreCreditCard } from "@/components/account/store-credit-card"
import { getStoreCreditBalance } from "@/lib/data/cart"
import { DEMO_MODE } from "@/lib/data/mode"
import { listProducts } from "@/lib/data/catalog"
import { listOrders } from "@/lib/data/customer"
import { currentSession } from "@/lib/data/session"

export default async function AccountPage() {
  const session = await currentSession()
  if (!session) redirect("/sign-in?next=/account")
  const [orders, products, credit] = await Promise.all([listOrders(), listProducts(), getStoreCreditBalance()])
  return (
    <AccountOverview
      customer={session.customer}
      addresses={session.addresses}
      orders={orders}
      products={products}
      storeCredit={DEMO_MODE ? undefined : <StoreCreditCard balance={credit} currency="inr" />}
    />
  )
}

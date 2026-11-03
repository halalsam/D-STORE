import type { Metadata } from "next"
import { AddressesView } from "@/components/account/addresses-view"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Addresses" }

export default async function AddressesPage() {
  const session = await currentSession()
  return <AddressesView addresses={session?.addresses ?? []} />
}

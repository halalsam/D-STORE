import type { Metadata } from "next"
import { SavedView } from "@/components/account/saved-view"
import { listProducts } from "@/lib/data/catalog"

export const metadata: Metadata = { title: "Saved" }

export default async function SavedPage() {
  return <SavedView products={await listProducts()} />
}

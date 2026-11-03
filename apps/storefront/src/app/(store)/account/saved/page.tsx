import type { Metadata } from "next"
import { SavedView } from "@/components/account/saved-view"

export const metadata: Metadata = { title: "Saved" }

export default function SavedPage() {
  return <SavedView />
}

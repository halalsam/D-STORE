import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ProfileView } from "@/components/account/profile-view"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage() {
  const session = await currentSession()
  if (!session) redirect("/sign-in?next=/account/profile")
  return <ProfileView customer={session.customer} />
}

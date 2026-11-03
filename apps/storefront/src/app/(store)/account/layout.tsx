import type { Metadata } from "next"
import { AccountNav } from "@/components/account/account-nav"

export const metadata: Metadata = { title: { default: "Account", template: "%s | Account | D-STORE" } }

/** TODO: guard with Medusa auth (redirect to /sign-in without a session). */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="sheet">
      <div className="page-x grid grid-cols-1 gap-grid pb-section lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  )
}

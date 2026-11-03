import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense, type ReactNode } from "react"
import { AccountNav } from "@/components/account/account-nav"
import { currentSession } from "@/lib/data/session"

export const metadata: Metadata = { title: { default: "Account", template: "%s | Account | D-STORE" } }

async function AccountShell({ children }: { children: ReactNode }) {
  const session = await currentSession()
  if (!session) redirect("/sign-in?next=/account")
  return (
    <>
      <AccountNav customer={session.customer} />
      <div className="min-w-0">{children}</div>
    </>
  )
}

function ShellFallback() {
  return (
    <>
      <div className="h-72 rounded-panel skeleton" />
      <div className="grid content-start gap-grid">
        <div className="h-10 w-48 rounded-pill skeleton" />
        <div className="h-64 rounded-panel skeleton" />
      </div>
    </>
  )
}

export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <main className="sheet">
      <div className="page-x grid grid-cols-1 gap-grid pb-section lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-6">
        <Suspense fallback={<ShellFallback />}>
          <AccountShell>{children}</AccountShell>
        </Suspense>
      </div>
    </main>
  )
}

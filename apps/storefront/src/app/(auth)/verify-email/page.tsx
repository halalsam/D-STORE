import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "@/components/ui/icons"
import { verifyEmail } from "@/lib/data/customer"
import { Logo } from "@/components/ui/logo"

export const metadata: Metadata = { title: "Confirm email", robots: { index: false } }

async function Verify({ searchParams }: { searchParams: PageProps<"/verify-email">["searchParams"] }) {
  const { token } = await searchParams
  const res = typeof token === "string" && token ? await verifyEmail(token) : null
  if (!res?.ok) {
    return (
      <div>
        <h1 className="type-heading-md">Link not valid</h1>
        <p className="mt-1 type-body-sm text-ink-muted">This link is invalid or has expired. Sign in and send a new one from your orders page.</p>
        <Button asChild className="mt-6"><Link href="/sign-in?next=/account/orders">Go to sign in</Link></Button>
      </div>
    )
  }
  const { linked } = res.data
  return (
    <div>
      <p className="flex items-center gap-2 type-body-sm text-success"><Check className="size-4" /> Email confirmed</p>
      <h1 className="mt-2 type-heading-md">{linked ? `${linked} ${linked === 1 ? "order" : "orders"} added to your account` : "You are all set"}</h1>
      <p className="mt-1 type-body-sm text-ink-muted">Orders you place with this email, signed in or not, now show up in your account.</p>
      <Button asChild className="mt-6"><Link href="/account/orders">View orders</Link></Button>
    </div>
  )
}

export default function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-gutter">
      <Link href="/" aria-label="MotionFit home" className="pressable mt-12 block">
        <Logo decorative className="h-6" />
      </Link>
      <main className="flex w-full max-w-sm flex-1 flex-col justify-center py-16">
        <Suspense fallback={<div className="h-48 rounded-xl skeleton" />}>
          <Verify searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}

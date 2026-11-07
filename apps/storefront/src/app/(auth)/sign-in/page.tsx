import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { SignInForm } from "@/components/store/sign-in-form"
import { Logo } from "@/components/ui/logo"

export const metadata: Metadata = { title: "Sign in" }

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-gutter">
      <Link href="/" aria-label="MotionFit home" className="pressable mt-12 block">
        <Logo decorative className="h-6" />
      </Link>
      <main className="flex w-full max-w-sm flex-1 flex-col justify-center py-16">
        <Suspense fallback={<div className="h-64 rounded-xl skeleton" />}>
          <SignInForm />
        </Suspense>
      </main>
      <Link href="/privacy" className="mb-8 type-body-sm text-accent-ink hover:underline">Privacy policy</Link>
    </div>
  )
}

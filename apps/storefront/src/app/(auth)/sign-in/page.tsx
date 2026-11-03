import type { Metadata } from "next"
import Link from "next/link"
import { SignInForm } from "@/components/store/sign-in-form"

export const metadata: Metadata = { title: "Sign in" }

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-gutter">
      <Link href="/" className="pressable mt-12 font-display text-[2rem] font-bold tracking-[-0.04em]">
        D-STORE
      </Link>
      <main className="flex w-full max-w-sm flex-1 flex-col justify-center py-16">
        <SignInForm />
      </main>
      <Link href="/privacy" className="mb-8 type-body-sm text-accent-ink hover:underline">Privacy policy</Link>
    </div>
  )
}

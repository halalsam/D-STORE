import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/store/reset-password-form"

export const metadata: Metadata = { title: "Reset password", robots: { index: false } }

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-surface px-gutter">
      <Link href="/" className="pressable mt-12 font-display text-[2rem] font-bold tracking-[-0.04em]">
        D-STORE
      </Link>
      <main className="flex w-full max-w-sm flex-1 flex-col justify-center py-16">
        <Suspense fallback={<div className="h-64 rounded-xl skeleton" />}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  )
}

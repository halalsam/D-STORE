"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "@/components/ui/icons"
import { TextField } from "@/components/ui/text-field"
import { resetPassword } from "@/lib/data/password"

export function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const email = params.get("email") ?? ""
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  if (!token || !email) {
    return (
      <div>
        <h1 className="type-heading-md">Link not valid</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Open the link from the reset email again, or request a new one.</p>
        <Button asChild className="mt-6"><Link href="/sign-in">Go to sign in</Link></Button>
      </div>
    )
  }

  if (done) {
    return (
      <div>
        <p className="flex items-center gap-2 type-body-sm text-success"><Check className="size-4" /> Password updated</p>
        <h1 className="mt-2 type-heading-md">Sign in with your new password</h1>
        <Button asChild className="mt-6"><Link href="/sign-in">Sign in</Link></Button>
      </div>
    )
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const f = new FormData(e.currentTarget)
        const password = String(f.get("password") ?? "")
        if (password.length < 8) return setError("Use at least 8 characters")
        if (password !== String(f.get("confirm") ?? "")) return setError("The passwords do not match")
        setError(undefined)
        start(async () => {
          const res = await resetPassword({ email, token, password })
          if (res.ok) setDone(true)
          else setError(res.error)
        })
      }}
    >
      <h1 className="type-heading-md">Choose a new password</h1>
      <p className="mt-1 type-body-sm text-ink-muted">For {email}</p>
      <div className="mt-6 grid gap-3">
        <TextField name="password" type="password" label="New password" hideLabel placeholder="New password (8+ characters)" autoComplete="new-password" />
        <TextField name="confirm" type="password" label="Confirm password" hideLabel placeholder="Repeat new password" autoComplete="new-password" error={error} />
        <Button type="submit" size="xl" block loading={pending}>Update password</Button>
      </div>
    </form>
  )
}

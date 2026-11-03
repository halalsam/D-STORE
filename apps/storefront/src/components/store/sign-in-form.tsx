"use client"

import Link from "next/link"
import { ArrowRight, MailCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { TextField } from "@/components/ui/text-field"

/**
 * Passwordless-style sign in. TODO: wire to Medusa auth
 * (sdk.auth.login / register with the emailpass provider).
 */
export function SignInForm() {
  const [sent, setSent] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (sent) {
    return (
      <div className="animate-rise-in text-center">
        <span className="mx-auto grid size-14 animate-pop place-items-center rounded-pill bg-accent-soft text-ink">
          <MailCheck className="size-6" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 type-heading-md">Check your inbox</h1>
        <p className="mt-1 type-body-sm text-ink-muted">We sent a sign in link to {sent}.</p>
        <Button variant="soft" size="md" className="mt-6" onClick={() => setSent(null)}>Use another email</Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget).get("email"))
        setPending(true)
        setTimeout(() => {
          setPending(false)
          setSent(email)
        }, 700)
      }}
    >
      <h1 className="type-heading-md">Sign in</h1>
      <p className="mt-1 type-body-sm text-ink-muted">Sign in or create an account</p>
      <TextField
        type="email"
        name="email"
        required
        autoComplete="email"
        label="Email"
        hideLabel
        placeholder="Email"
        className="mt-6"
        trailing={
          <Button type="submit" variant="ghost" size="icon" aria-label="Continue" loading={pending}>
            <ArrowRight strokeWidth={1.6} />
          </Button>
        }
      />
      <Checkbox label="Email me with news and offers" defaultChecked className="mt-4" />
      <p className="mt-6 text-center type-caption text-ink-muted">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-ink underline underline-offset-2">Terms of service</Link>
      </p>
    </form>
  )
}

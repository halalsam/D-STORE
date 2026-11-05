"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { MailCheck } from "@/components/ui/icons"
import { resendEmailVerification } from "@/lib/data/customer"

/** Guest orders only move into the account after the email is confirmed. */
export function VerifyEmailNotice({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()

  return (
    <section className="panel mb-tile flex flex-wrap items-center gap-4 animate-rise-in">
      <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-surface-muted text-ink-muted [&_svg]:size-5">
        <MailCheck />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-title">Missing an order?</p>
        <p className="type-body-sm text-ink-muted">
          {sent ? `We sent a link to ${email}. Open it to add orders you placed as a guest.` : `Confirm ${email} to add orders you placed as a guest.`}
        </p>
        {error && <p className="mt-1 type-caption text-danger">{error}</p>}
      </div>
      {!sent && (
        <Button
          size="md"
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await resendEmailVerification()
              if (res.ok) setSent(true)
              else setError(res.error)
            })
          }
        >
          Send link
        </Button>
      )}
    </section>
  )
}

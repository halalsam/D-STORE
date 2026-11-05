"use client"

import { ArrowRight, Check } from "@/components/ui/icons"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/text-field"
import { subscribeNewsletter } from "@/lib/data/newsletter"

export function NewsletterForm() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  if (done) {
    return (
      <p className="mt-5 flex animate-rise-in items-center gap-2 type-body-sm text-success">
        <Check className="size-4" /> You are on the list.
      </p>
    )
  }
  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault()
        const email = String(new FormData(e.currentTarget).get("email") ?? "").trim()
        start(async () => {
          const res = await subscribeNewsletter(email)
          if (res.ok) setDone(true)
          else setError(res.error)
        })
      }}
    >
      <TextField
        type="email"
        name="email"
        required
        label="Email"
        hideLabel
        placeholder="Email address"
        autoComplete="email"
        error={error}
        fieldClassName="rounded-pill bg-canvas ring-0 [--autofill-bg:var(--color-canvas)]"
        trailing={
          <Button type="submit" size="icon" aria-label="Subscribe" loading={pending}>
            <ArrowRight strokeWidth={1.6} />
          </Button>
        }
      />
    </form>
  )
}

"use client"

import { ArrowRight, Check } from "@/components/ui/icons"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/text-field"

/** TODO: post to a newsletter endpoint once one exists. */
export function NewsletterForm() {
  const [done, setDone] = useState(false)
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
        setDone(true)
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
        fieldClassName="rounded-pill bg-canvas ring-0 [--autofill-bg:var(--color-canvas)]"
        trailing={
          <Button type="submit" size="icon" aria-label="Subscribe">
            <ArrowRight strokeWidth={1.6} />
          </Button>
        }
      />
    </form>
  )
}

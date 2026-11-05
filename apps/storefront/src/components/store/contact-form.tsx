"use client"

import { Check } from "@/components/ui/icons"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/text-field"

const topics = ["Order or delivery", "Returns", "Sizing", "Something else"]

/** TODO: post to a support endpoint once one exists; nothing is sent yet. */
export function ContactForm({ demo }: { demo: boolean }) {
  const [done, setDone] = useState(false)
  const messageId = useId()

  if (done) {
    return (
      <div className="animate-rise-in rounded-lg bg-canvas px-4 py-4">
        <p className="flex items-center gap-2 type-body text-success">
          <Check className="size-4" /> Message received.
        </p>
        <p className="mt-1 type-body-sm text-ink-muted">
          {demo ? "Demo store: messages are not sent anywhere." : "We will reply to the email address you gave us."}
        </p>
      </div>
    )
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setDone(true)
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="name" label="Name" required autoComplete="name" />
        <TextField type="email" name="email" label="Email" required autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField name="order" label="Order number" hint="Optional" />
        <div className="grid gap-1.5">
          <label htmlFor={`${messageId}-topic`} className="type-body-sm text-ink">Topic</label>
          <select
            id={`${messageId}-topic`}
            name="topic"
            className="h-12 rounded-md bg-surface px-4 type-body text-ink ring-1 ring-line-strong ring-inset outline-none focus:ring-2 focus:ring-accent"
          >
            {topics.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={messageId} className="type-body-sm text-ink">Message</label>
        <textarea
          id={messageId}
          name="message"
          required
          rows={5}
          className="rounded-md bg-surface px-4 py-3 type-body text-ink ring-1 ring-line-strong ring-inset outline-none focus:ring-2 focus:ring-accent"
        />
      </div>
      <Button type="submit" className="justify-self-start">Send message</Button>
    </form>
  )
}

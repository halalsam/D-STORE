"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Gift } from "@/components/ui/icons"
import { TextField } from "@/components/ui/text-field"
import { toast } from "@/components/ui/toast"
import { claimGiftCard } from "@/lib/data/customer"
import { formatPrice } from "@/lib/format"

export function StoreCreditCard({ balance, currency }: { balance: number; currency: string }) {
  const router = useRouter()
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()

  return (
    <section className="panel flex flex-col justify-between gap-5">
      <div>
        <p className="flex items-center gap-2 type-overline text-ink-muted"><Gift className="size-3.5" /> Store credit</p>
        <p className="mt-3 type-heading-md type-price">{formatPrice(balance, currency)}</p>
        <p className="type-caption text-ink-muted">Turn it on at checkout to spend it.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const code = String(new FormData(form).get("code") ?? "").trim()
          if (!code) return
          start(async () => {
            const res = await claimGiftCard(code)
            if (!res.ok) return setError(res.error)
            setError(undefined)
            form.reset()
            toast("Gift card added to your store credit")
            router.refresh()
          })
        }}
      >
        <TextField
          name="code"
          label="Add a gift card"
          hideLabel
          placeholder="Add a gift card code"
          autoCapitalize="characters"
          error={error}
          trailing={<Button type="submit" variant="soft" size="sm" loading={pending}>Add</Button>}
        />
      </form>
    </section>
  )
}

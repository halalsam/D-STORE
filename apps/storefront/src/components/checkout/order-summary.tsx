"use client"

import { useState, useTransition } from "react"
import { LineItem, Totals } from "@/components/account/order-parts"
import { Button } from "@/components/ui/button"
import { Tag, X } from "@/components/ui/icons"
import { TextField } from "@/components/ui/text-field"
import { applyPromoCode, removePromoCode } from "@/lib/data/cart"
import type { Bag } from "@/lib/types"
import { cn } from "@/lib/utils"

type Props = { bag: Bag; onBag: (bag: Bag) => void; className?: string }

export function OrderSummary({ bag, onBag, className }: Props) {
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)
  const [pending, start] = useTransition()
  const promo = bag.promoCodes[0]

  return (
    <div className={cn("grid gap-5", className)}>
      <ul className="grid max-h-[22rem] gap-3 overflow-y-auto overscroll-contain pr-1">
        {bag.lines.map((l) => (
          <li key={l.key}><LineItem line={l} currency={bag.currency} compact /></li>
        ))}
      </ul>

      {promo ? (
        <div className="flex animate-rise-in items-center justify-between rounded-lg bg-success-soft px-3 py-2.5">
          <span className="flex items-center gap-2 type-body-sm text-success"><Tag className="size-4" strokeWidth={1.8} /> {promo} applied</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove code"
            loading={pending}
            className="text-success"
            onClick={() =>
              start(async () => {
                const res = await removePromoCode(promo)
                if (res.ok) onBag(res.data)
              })
            }
          >
            <X strokeWidth={1.8} />
          </Button>
        </div>
      ) : (
        <form
          key={attempt}
          className={attempt > 0 && error ? "animate-shake" : undefined}
          onSubmit={(e) => {
            e.preventDefault()
            const code = String(new FormData(e.currentTarget).get("code") ?? "").trim().toUpperCase()
            if (!code) return
            start(async () => {
              const res = await applyPromoCode(code)
              if (res.ok) {
                setError(undefined)
                onBag(res.data)
              } else {
                setError(res.error)
                setAttempt((n) => n + 1)
              }
            })
          }}
        >
          <TextField
            name="code"
            label="Discount code"
            hideLabel
            placeholder="Discount code"
            autoCapitalize="characters"
            error={error}
            hint={!error ? "Try WELCOME10" : undefined}
            trailing={<Button type="submit" variant="soft" size="sm" loading={pending}>Apply</Button>}
          />
        </form>
      )}

      <Totals
        subtotal={bag.subtotal}
        discount={bag.discount}
        shipping={bag.shipping}
        total={bag.total}
        currency={bag.currency}
        discountLabel={promo}
      />
    </div>
  )
}

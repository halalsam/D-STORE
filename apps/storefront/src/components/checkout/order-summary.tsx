"use client"

import { Tag, X } from "@/components/ui/icons"
import { useState } from "react"
import { LineItem, Totals } from "@/components/account/order-parts"
import { Button } from "@/components/ui/button"
import { TextField } from "@/components/ui/text-field"
import type { BagLine } from "@/lib/stores/bag"
import { cn } from "@/lib/utils"
import { promoCodes } from "./checkout-data"

export function toOrderLine(l: BagLine) {
  return {
    handle: l.product.handle,
    title: l.product.title,
    size: l.size,
    quantity: l.quantity,
    unitPrice: l.product.price,
    tone: l.product.tones[0],
    silhouette: l.product.silhouette,
  }
}

type Props = {
  lines: BagLine[]
  subtotal: number
  discount: number
  shipping: number | null
  total: number
  promo: string | null
  onPromo: (code: string | null) => void
  className?: string
}

export function OrderSummary({ lines, subtotal, discount, shipping, total, promo, onPromo, className }: Props) {
  const [error, setError] = useState<string>()
  const [attempt, setAttempt] = useState(0)

  return (
    <div className={cn("grid gap-5", className)}>
      <ul className="grid max-h-[22rem] gap-3 overflow-y-auto overscroll-contain pr-1">
        {lines.map((l) => (
          <li key={l.key}><LineItem line={toOrderLine(l)} compact /></li>
        ))}
      </ul>

      {promo ? (
        <div className="flex animate-rise-in items-center justify-between rounded-lg bg-success-soft px-3 py-2.5">
          <span className="flex items-center gap-2 type-body-sm text-success"><Tag className="size-4" strokeWidth={1.8} /> {promo} applied</span>
          <Button variant="ghost" size="icon-sm" aria-label="Remove code" onClick={() => onPromo(null)} className="text-success">
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
            if (promoCodes[code]) {
              setError(undefined)
              onPromo(code)
            } else {
              setError("That code is not valid")
              setAttempt((n) => n + 1)
            }
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
            trailing={<Button type="submit" variant="soft" size="sm">Apply</Button>}
          />
        </form>
      )}

      <Totals subtotal={subtotal} discount={discount} shipping={shipping} total={total} discountLabel={promo ?? undefined} />
    </div>
  )
}

"use client"

import { useState, useTransition } from "react"
import { LineItem, Totals } from "@/components/account/order-parts"
import { Button } from "@/components/ui/button"
import { Gift, Tag, X } from "@/components/ui/icons"
import { Switch } from "@/components/ui/switch"
import { TextField } from "@/components/ui/text-field"
import { applyGiftCard, applyPromoCode, removeGiftCard, removePromoCode, setStoreCredit } from "@/lib/data/cart"
import { formatPrice } from "@/lib/format"
import type { Bag } from "@/lib/types"
import { useShake } from "@/lib/use-shake"
import { cn } from "@/lib/utils"

type Props = { bag: Bag; onBag: (bag: Bag) => void; className?: string; storeCredit?: number }

function GiftCards({ bag, onBag, storeCredit = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  const codes = bag.giftCards ?? []

  return (
    <div className="grid gap-2">
      {codes.map((code) => (
        <div key={code} className="flex animate-rise-in items-center justify-between rounded-lg bg-success-soft px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 type-body-sm text-success"><Gift className="size-4 shrink-0" strokeWidth={1.8} /> <span className="truncate">Gift card {code}</span></span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Remove gift card ${code}`}
            loading={pending}
            className="text-success"
            onClick={() => start(async () => { const res = await removeGiftCard(code); if (res.ok) onBag(res.data) })}
          >
            <X strokeWidth={1.8} />
          </Button>
        </div>
      ))}

      {storeCredit > 0 && (
        <Switch
          className="rounded-lg px-3 py-2.5 ring-1 ring-line ring-inset"
          label={<span className="type-body-sm">Use store credit</span>}
          description={`${formatPrice(storeCredit, bag.currency)} available`}
          checked={!!bag.storeCreditApplied}
          disabled={pending}
          onCheckedChange={(v) => start(async () => { const res = await setStoreCredit(v); if (res.ok) onBag(res.data); else setError(res.error) })}
        />
      )}

      {open ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const code = String(new FormData(e.currentTarget).get("giftcard") ?? "").trim()
            if (!code) return
            start(async () => {
              const res = await applyGiftCard(code)
              if (!res.ok) return setError(res.error)
              setError(undefined)
              setOpen(false)
              onBag(res.data)
            })
          }}
        >
          <TextField
            name="giftcard"
            label="Gift card code"
            hideLabel
            placeholder="Gift card code"
            autoCapitalize="characters"
            autoFocus
            error={error}
            trailing={<Button type="submit" variant="soft" size="sm" loading={pending}>Apply</Button>}
          />
        </form>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="pressable justify-self-start type-body-sm text-accent-ink underline underline-offset-2">
          Have a gift card?
        </button>
      )}
      {!open && error && <p className="type-caption text-danger">{error}</p>}
    </div>
  )
}

export function OrderSummary({ bag, onBag, className, storeCredit }: Props) {
  const [error, setError] = useState<string>()
  const [shakeRef, shake] = useShake<HTMLFormElement>()
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
          ref={shakeRef}
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
                shake()
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

      <GiftCards bag={bag} onBag={onBag} storeCredit={storeCredit} />

      <Totals
        credit={bag.credit}
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

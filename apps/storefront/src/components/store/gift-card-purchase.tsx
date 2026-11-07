"use client"

import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Expand } from "@/components/ui/expand"
import { Gift, MailCheck, Wallet } from "@/components/ui/icons"
import { Price } from "@/components/ui/price"
import { SizeSelector } from "@/components/ui/size-selector"
import { TextField } from "@/components/ui/text-field"
import { useBag } from "@/lib/stores/bag"
import type { Product } from "@/lib/types"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const perks = [
  { icon: MailCheck, label: "Emailed in minutes" },
  { icon: Wallet, label: "Use over many orders" },
  { icon: Gift, label: "Add a personal note" },
]

/** Amount, optional recipient and note. The code is emailed by the backend job send-gift-card-codes. */
export function GiftCardPurchase({ product, rating }: { product: Product; rating?: ReactNode }) {
  const router = useRouter()
  const { add } = useBag()
  const [amount, setAmount] = useState(product.sizes[0]?.label)
  const [forSomeone, setForSomeone] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState<"add" | "buy" | null>(null)
  const price = product.sizes.find((s) => s.label === amount)?.price ?? product.price

  const go = async (kind: "add" | "buy") => {
    if (!amount) return
    if (forSomeone && !EMAIL.test(recipientEmail)) return setError("Enter the recipient's email")
    setError(undefined)
    setPending(kind)
    const gift = forSomeone ? { recipientEmail, recipientName, message } : {}
    const ok = await add(product, amount, kind === "add" ? { open: true, gift } : { silent: true, gift })
    if (ok && kind === "buy") return router.push("/checkout")
    setPending(null)
  }

  return (
    <section className="shrink-0 rounded-xl bg-surface p-4 ring-1 ring-line ring-inset md:p-5">
      <p className="type-overline text-ink-muted">MotionFit · Digital gift card</p>
      <h1 className="mt-1.5 type-heading-md">{product.title}</h1>
      {rating}
      <Price amount={price} currency={product.currency} className="mt-1 block type-body-lg" />

      <div className="mt-4">
        <p className="mb-2 type-body-sm">Amount</p>
        <SizeSelector sizes={product.sizes} value={amount} onValueChange={setAmount} columns={4} name="amount" />
      </div>

      <Checkbox label="Send it to someone else" checked={forSomeone} onCheckedChange={(v) => setForSomeone(v === true)} className="mt-4" />
      <Expand open={forSomeone}>
        <div className="grid gap-3 pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Their name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={80} />
            <TextField label="Their email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} error={error} />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="gift-message" className="type-body-sm">Note <span className="text-ink-muted">(optional)</span></label>
            <textarea
              id="gift-message"
              rows={3}
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-md bg-surface px-4 py-3 type-body text-ink ring-1 ring-line-strong ring-inset outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <p className="type-caption text-ink-muted">We email them the code with your note. You get the order confirmation.</p>
        </div>
      </Expand>

      <div className="mt-4 grid grid-cols-2 gap-1.5">
        <Button variant="secondary" size="xl" disabled={!amount || pending !== null} loading={pending === "add"} onClick={() => void go("add")}>
          Add to bag
        </Button>
        <Button size="xl" disabled={!amount || pending !== null} loading={pending === "buy"} onClick={() => void go("buy")}>
          Buy now
        </Button>
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5">
        {perks.map(({ icon: Icon, label }) => (
          <li key={label} className="flex flex-col items-center gap-1 text-center type-caption text-ink-muted sm:flex-row sm:justify-center sm:gap-1.5">
            <Icon className="size-4 shrink-0 sm:size-3.5" strokeWidth={1.8} /> {label}
          </li>
        ))}
      </ul>
    </section>
  )
}

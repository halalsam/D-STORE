"use client"

import { useState, useTransition, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Check } from "@/components/ui/icons"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SizeSelector } from "@/components/ui/size-selector"
import { TextField } from "@/components/ui/text-field"
import { subscribeRestock } from "@/lib/data/restock"
import type { Product } from "@/lib/types"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Pick a sold-out size and leave an email; the backend job send-restock-alerts emails once it is back. */
export function NotifyMe({ product, trigger, email: initialEmail = "" }: { product: Product; trigger: ReactNode; email?: string }) {
  const soldOut = product.sizes.filter((s) => !s.available)
  const [open, setOpen] = useState(false)
  const [size, setSize] = useState(soldOut.length === 1 ? soldOut[0].label : undefined)
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  const submit = () => {
    const variant = soldOut.find((s) => s.label === size)
    if (!variant) return setError("Choose a size")
    if (!EMAIL.test(email)) return setError("Enter a valid email")
    setError(undefined)
    start(async () => {
      const res = await subscribeRestock(variant.variantId, email)
      if (res.ok) setDone(true)
      else setError(res.error)
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDone(false) }}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="adaptive" title="Notify me" subtitle={product.title} bodyClassName="grid gap-5 p-4 md:p-6">
        {done ? (
          <div className="grid justify-items-start gap-3 py-2">
            <p className="flex items-center gap-2 type-body-sm text-success"><Check className="size-4" /> You&rsquo;re on the list</p>
            <p className="type-body-sm text-ink-muted">We&rsquo;ll email {email} once size {size} is back. Just once, no newsletter.</p>
            <Button variant="secondary" size="md" onClick={() => setOpen(false)}>Done</Button>
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 type-body-sm">Which size?</p>
              <SizeSelector sizes={soldOut.map((s) => ({ ...s, available: true }))} value={size} onValueChange={setSize} columns={soldOut.length > 4 ? 5 : 4} name="restock-size" />
            </div>
            <TextField type="email" label="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error && <p className="-mt-3 type-caption text-danger">{error}</p>}
            <Button size="lg" loading={pending} onClick={submit}>Email me when it&rsquo;s back</Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

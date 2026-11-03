"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, CreditCard, Lock, ShoppingBag, Smartphone, Truck, Wallet } from "lucide-react"
import { useState } from "react"
import { AddressLines } from "@/components/account/address-card"
import { AddressForm } from "@/components/account/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Expand } from "@/components/ui/expand"
import { RadioCards } from "@/components/ui/radio-cards"
import { TextField } from "@/components/ui/text-field"
import { formatPrice } from "@/lib/format"
import type { Address, Order } from "@/lib/mock/account"
import { placeOrder, saveAddress, useAddresses, useCustomer } from "@/lib/stores/account"
import { useBag } from "@/lib/stores/bag"
import { useHydrated } from "@/lib/stores/create-store"
import { cn } from "@/lib/utils"
import { deliveryOptions, paymentOptions, promoCodes } from "./checkout-data"
import { OrderSummary, toOrderLine } from "./order-summary"
import { StepCard } from "./step-card"

type Step = 1 | 2 | 3 | 4

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UPI = /^[\w.-]{2,}@[a-zA-Z]{2,}$/

const paymentIcon = { upi: <Smartphone strokeWidth={1.6} />, card: <CreditCard strokeWidth={1.6} />, cod: <Wallet strokeWidth={1.6} /> }

export function CheckoutFlow() {
  const hydrated = useHydrated()
  const router = useRouter()
  const { lines, subtotal, clear } = useBag()
  const customer = useCustomer()
  const addresses = useAddresses()

  const [step, setStep] = useState<Step>(1)
  const [reached, setReached] = useState<Step>(1)
  const [email, setEmail] = useState(customer.email)
  const [emailError, setEmailError] = useState<string>()
  const [addressChoice, setAddressChoice] = useState<string>(() => addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new")
  const [address, setAddress] = useState<Address | null>(null)
  const [saveNew, setSaveNew] = useState(true)
  const [delivery, setDelivery] = useState<string>("standard")
  const [payment, setPayment] = useState<string>("upi")
  const [upiId, setUpiId] = useState("")
  const [upiError, setUpiError] = useState<string>()
  const [promo, setPromo] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const deliveryOption = deliveryOptions.find((d) => d.id === delivery)!
  const paymentOption = paymentOptions.find((p) => p.id === payment)!
  const discount = promo ? Math.round((subtotal * promoCodes[promo].percent) / 100) : 0
  const shipping = reached >= 2 ? deliveryOption.price : null
  const total = subtotal - discount + (shipping ?? 0)

  const go = (s: Step) => {
    setStep(s)
    setReached((r) => (s > r ? s : r))
    requestAnimationFrame(() => document.getElementById(`step-${s}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }
  const stateOf = (s: Step) => (step === s ? "active" : reached > s || (reached === s && step > s) ? "done" : "upcoming")

  if (!hydrated) {
    return (
      <div className="grid gap-grid lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="grid gap-grid">{[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-panel skeleton" />)}</div>
        <div className="h-96 rounded-panel skeleton" />
      </div>
    )
  }

  if (lines.length === 0 && !placing) {
    return (
      <div className="panel mx-auto grid max-w-lg animate-rise-in place-items-center py-16 text-center">
        <span className="grid size-16 place-items-center rounded-pill bg-surface-muted text-ink-muted"><ShoppingBag className="size-6" strokeWidth={1.4} /></span>
        <h1 className="mt-5 type-heading-md">Your bag is empty</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Add a few pieces, then come back to check out.</p>
        <Button asChild className="mt-6"><Link href="/collections/new-arrivals">Shop new in</Link></Button>
      </div>
    )
  }

  const continueFromInfo = () => {
    if (!EMAIL.test(email)) {
      setEmailError("Enter a valid email")
      return
    }
    setEmailError(undefined)
    if (addressChoice === "new") {
      ;(document.getElementById("checkout-address") as HTMLFormElement | null)?.requestSubmit()
      return
    }
    setAddress(addresses.find((a) => a.id === addressChoice) ?? null)
    go(2)
  }

  const continueFromPayment = () => {
    if (payment === "upi" && !UPI.test(upiId)) {
      setUpiError("Enter a UPI ID like name@bank")
      return
    }
    setUpiError(undefined)
    go(4)
  }

  const submitOrder = () => {
    if (!address) return go(1)
    setPlacing(true)
    // TODO: Medusa: cart.update (email, addresses) -> addShippingMethod ->
    // initiatePaymentSession -> cart.complete. Simulated here.
    setTimeout(() => {
      const id = `DS-${Date.now().toString().slice(-5)}`
      const order: Order = {
        id,
        createdAt: new Date().toISOString(),
        status: "placed",
        email,
        lines: lines.map(toOrderLine),
        shippingAddress: {
          firstName: address.firstName, lastName: address.lastName, phone: address.phone, line1: address.line1,
          line2: address.line2, city: address.city, state: address.state, postalCode: address.postalCode, country: address.country,
        },
        delivery: { id: deliveryOption.id, label: deliveryOption.label, price: deliveryOption.price },
        payment: { id: paymentOption.id, label: payment === "upi" ? `UPI (${upiId})` : paymentOption.label },
        subtotal,
        discount,
        shipping: deliveryOption.price,
        total: subtotal - discount + deliveryOption.price,
        currency: "inr",
      }
      placeOrder(order)
      router.push(`/checkout/confirmed?order=${id}`)
      clear()
    }, 1100)
  }

  const summary = (
    <OrderSummary lines={lines} subtotal={subtotal} discount={discount} shipping={shipping} total={total} promo={promo} onPromo={setPromo} />
  )

  return (
    <div className="grid grid-cols-1 gap-grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-6">
      {/* Mobile summary toggle */}
      <div className="panel p-0 lg:hidden">
        <button onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between gap-3 p-5">
          <span className="flex items-center gap-2 type-body-sm text-accent-ink">
            <ShoppingBag className="size-4" strokeWidth={1.6} />
            {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={cn("size-4 transition-transform duration-(--duration-spring) ease-spring", summaryOpen && "rotate-180")} />
          </span>
          <span className="type-heading-sm type-price">{formatPrice(total)}</span>
        </button>
        <Expand open={summaryOpen}><div className="px-5 pb-5">{summary}</div></Expand>
      </div>

      <div className="grid content-start gap-grid">
        <div id="step-1" className="scroll-mt-(--header-h)">
          <StepCard
            index={1}
            title="Contact and address"
            state={stateOf(1)}
            onEdit={() => go(1)}
            summary={
              address && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <p className="type-body-sm text-ink-muted">{email}</p>
                  <AddressLines address={address} />
                </div>
              )
            }
          >
            <div className="grid gap-6">
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                hint="Order confirmation and tracking go here."
              />
              <div className="grid gap-3">
                <p className="type-body-sm text-ink">Ship to</p>
                <RadioCards
                  label="Shipping address"
                  value={addressChoice}
                  onValueChange={setAddressChoice}
                  options={[
                    ...addresses.map((a) => ({
                      value: a.id,
                      title: a.label ?? `${a.firstName} ${a.lastName}`,
                      description: `${a.line1}, ${a.city} ${a.postalCode}`,
                    })),
                    {
                      value: "new",
                      title: "Use a new address",
                      details: (
                        <div className="border-t border-line pt-4">
                          <AddressForm
                            id="checkout-address"
                            initial={{ firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone }}
                            onSubmit={(a) => {
                              const withLabel = { ...a, label: a.label ?? "New address" }
                              if (saveNew) saveAddress(withLabel)
                              setAddress(withLabel)
                              if (saveNew) setAddressChoice(withLabel.id)
                              go(2)
                            }}
                          >
                            <Checkbox label="Save this address to my account" checked={saveNew} onCheckedChange={(v) => setSaveNew(v === true)} />
                          </AddressForm>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
              <Button size="xl" onClick={continueFromInfo} className="sm:justify-self-start sm:px-12">Continue to delivery</Button>
            </div>
          </StepCard>
        </div>

        <div id="step-2" className="scroll-mt-(--header-h)">
          <StepCard
            index={2}
            title="Delivery"
            state={stateOf(2)}
            onEdit={() => go(2)}
            summary={<p className="flex items-center gap-2 type-body-sm text-ink-muted"><Truck className="size-4" strokeWidth={1.6} /> {deliveryOption.label}, {deliveryOption.description.toLowerCase()} · {deliveryOption.price ? formatPrice(deliveryOption.price) : "Free"}</p>}
          >
            <div className="grid gap-6">
              <RadioCards
                label="Delivery method"
                value={delivery}
                onValueChange={setDelivery}
                options={deliveryOptions.map((d) => ({
                  value: d.id,
                  title: d.label,
                  description: d.description,
                  aside: d.price ? formatPrice(d.price) : "Free",
                }))}
              />
              <Button size="xl" onClick={() => go(3)} className="sm:justify-self-start sm:px-12">Continue to payment</Button>
            </div>
          </StepCard>
        </div>

        <div id="step-3" className="scroll-mt-(--header-h)">
          <StepCard
            index={3}
            title="Payment"
            state={stateOf(3)}
            onEdit={() => go(3)}
            summary={<p className="flex items-center gap-2 type-body-sm text-ink-muted [&_svg]:size-4">{paymentIcon[paymentOption.id]} {payment === "upi" ? `UPI, ${upiId}` : paymentOption.label}</p>}
          >
            <div className="grid gap-6">
              <RadioCards
                label="Payment method"
                value={payment}
                onValueChange={setPayment}
                options={paymentOptions.map((p) => ({
                  value: p.id,
                  title: p.label,
                  description: p.description,
                  aside: <span className="text-ink-muted [&_svg]:size-5">{paymentIcon[p.id]}</span>,
                  details:
                    p.id === "upi" ? (
                      <TextField label="UPI ID" placeholder="name@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} error={upiError} autoComplete="off" />
                    ) : p.id === "card" ? (
                      <div className="grid place-items-center gap-1 rounded-md border border-dashed border-line-strong bg-canvas px-4 py-6 text-center">
                        <Lock className="size-4 text-ink-muted" strokeWidth={1.8} />
                        <p className="type-body-sm text-ink">Secure card form</p>
                        <p className="max-w-xs type-caption text-ink-muted">Card details are entered in the payment provider&apos;s hosted field. It mounts here once a provider is connected.</p>
                      </div>
                    ) : undefined,
                }))}
              />
              <Checkbox label="Billing address same as shipping" defaultChecked />
              <Button size="xl" onClick={continueFromPayment} className="sm:justify-self-start sm:px-12">Review order</Button>
            </div>
          </StepCard>
        </div>

        <div id="step-4" className="scroll-mt-(--header-h)">
          <StepCard index={4} title="Review and place order" state={step === 4 ? "active" : "upcoming"}>
            <div className="grid gap-5">
              <p className="type-body-sm text-ink-muted">
                Check the details above. By placing your order you agree to our{" "}
                <Link href="/terms" className="text-ink underline underline-offset-2">terms</Link> and{" "}
                <Link href="/help/returns" className="text-ink underline underline-offset-2">returns policy</Link>.
              </p>
              <div className="flex items-baseline justify-between rounded-lg bg-canvas px-4 py-3">
                <span className="type-body-sm text-ink-muted">Total to pay</span>
                <span className="type-heading-md type-price">{formatPrice(total)}</span>
              </div>
              <Button size="xl" block loading={placing} onClick={submitOrder}>
                <Lock strokeWidth={1.8} /> Place order
              </Button>
            </div>
          </StepCard>
        </div>
      </div>

      {/* Desktop summary */}
      <aside className="hidden lg:block">
        <div className="panel sticky top-[calc(var(--header-h)+0.75rem)]">
          <h2 className="mb-5 type-title">Order summary</h2>
          {summary}
        </div>
      </aside>
    </div>
  )
}

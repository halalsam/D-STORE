"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { AddressLines } from "@/components/account/address-card"
import { AddressForm } from "@/components/account/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Expand } from "@/components/ui/expand"
import { ChevronDown, CreditCard, Lock, ShoppingBag, Smartphone, Truck, Wallet } from "@/components/ui/icons"
import { RadioCards } from "@/components/ui/radio-cards"
import { TextField } from "@/components/ui/text-field"
import { toast } from "@/components/ui/toast"
import { placeOrder, setCheckoutContact, setPaymentMethod, setShippingMethod, type ShippingChoice } from "@/lib/data/cart"
import { saveAddress, type Session } from "@/lib/data/customer"
import { formatPrice } from "@/lib/format"
import { paymentMethods } from "@/lib/site"
import { setBag as setClientBag } from "@/lib/stores/bag"
import { emptyBag, type Address, type Bag } from "@/lib/types"
import { cn } from "@/lib/utils"
import { OrderSummary } from "./order-summary"
import { StepCard } from "./step-card"

type Step = 1 | 2 | 3 | 4
type AddressFields = Omit<Address, "id" | "isDefault" | "label">

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UPI = /^[\w.-]{2,}@[a-zA-Z]{2,}$/
const paymentIcon: Record<string, React.ReactNode> = {
  upi: <Smartphone strokeWidth={1.6} />,
  card: <CreditCard strokeWidth={1.6} />,
  cod: <Wallet strokeWidth={1.6} />,
}

function fields(a: Address): AddressFields {
  return {
    firstName: a.firstName, lastName: a.lastName, phone: a.phone, line1: a.line1, line2: a.line2,
    city: a.city, state: a.state, postalCode: a.postalCode, country: a.country,
  }
}

export function CheckoutFlow({ initialBag, session }: { initialBag: Bag; session: Session }) {
  const router = useRouter()
  const addresses = session?.addresses ?? []
  const [bag, setBagState] = useState(initialBag)
  const [step, setStep] = useState<Step>(1)
  const [reached, setReached] = useState<Step>(1)
  const [email, setEmail] = useState(session?.customer.email ?? initialBag.email ?? "")
  const [emailError, setEmailError] = useState<string>()
  const [addressChoice, setAddressChoice] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new")
  const [address, setAddress] = useState<AddressFields | null>(initialBag.shippingAddress ?? null)
  const [saveNew, setSaveNew] = useState(true)
  const [options, setOptions] = useState<ShippingChoice[]>([])
  const [delivery, setDelivery] = useState<string>(initialBag.shippingMethodId ?? "")
  const [payment, setPayment] = useState<string>("upi")
  const [upiId, setUpiId] = useState("")
  const [upiError, setUpiError] = useState<string>()
  const [pending, start] = useTransition()
  const [placing, setPlacing] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const updateBag = (b: Bag) => {
    setBagState(b)
    setClientBag(b)
  }

  const deliveryOption = options.find((o) => o.id === delivery)
  const paymentOption = paymentMethods.find((p) => p.id === payment)!

  const go = (s: Step) => {
    setStep(s)
    setReached((r) => (s > r ? s : r))
    requestAnimationFrame(() => document.getElementById(`step-${s}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }
  const stateOf = (s: Step) => (step === s ? "active" : reached > s ? "done" : "upcoming")

  if (bag.lines.length === 0 && !placing) {
    return (
      <div className="panel mx-auto grid max-w-lg animate-rise-in place-items-center py-16 text-center">
        <span className="grid size-16 place-items-center rounded-pill bg-surface-muted text-ink-muted"><ShoppingBag className="size-6" strokeWidth={1.4} /></span>
        <h1 className="mt-5 type-heading-md">Your bag is empty</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Add a few pieces, then come back to check out.</p>
        <Button asChild className="mt-6"><Link href="/collections/new-arrivals">Shop new in</Link></Button>
      </div>
    )
  }

  const submitContact = (a: AddressFields) =>
    start(async () => {
      const res = await setCheckoutContact({ email, address: a })
      if (!res.ok) return void toast(res.error, "error")
      updateBag(res.data.bag)
      setAddress(a)
      setOptions(res.data.shipping)
      if (!res.data.shipping.some((o) => o.id === delivery)) setDelivery(res.data.shipping[0]?.id ?? "")
      go(2)
    })

  const continueFromInfo = () => {
    if (!EMAIL.test(email)) return setEmailError("Enter a valid email")
    setEmailError(undefined)
    if (addressChoice === "new") {
      ;(document.getElementById("checkout-address") as HTMLFormElement | null)?.requestSubmit()
      return
    }
    const saved = addresses.find((a) => a.id === addressChoice)
    if (saved) submitContact(fields(saved))
  }

  const continueFromDelivery = () =>
    start(async () => {
      if (!delivery) return void toast("Choose a delivery method", "error")
      const res = await setShippingMethod(delivery)
      if (!res.ok) return void toast(res.error, "error")
      updateBag(res.data)
      go(3)
    })

  const continueFromPayment = () => {
    if (payment === "upi" && !UPI.test(upiId)) return setUpiError("Enter a UPI ID like name@bank")
    setUpiError(undefined)
    start(async () => {
      const res = await setPaymentMethod(payment, payment === "upi" ? upiId : undefined)
      if (!res.ok) return void toast(res.error, "error")
      updateBag(res.data)
      go(4)
    })
  }

  const submitOrder = () => {
    setPlacing(true)
    start(async () => {
      const res = await placeOrder()
      if (!res.ok) {
        setPlacing(false)
        return void toast(res.error, "error")
      }
      setClientBag(emptyBag)
      router.push(`/checkout/confirmed?order=${res.data.orderId}`)
    })
  }

  const summary = <OrderSummary bag={bag} onBag={updateBag} />

  return (
    <div className="grid grid-cols-1 gap-tile lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-6">
      <div className="panel p-0 lg:hidden">
        <button onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between gap-3 p-5">
          <span className="flex items-center gap-2 type-body-sm text-accent-ink">
            <ShoppingBag className="size-4" strokeWidth={1.6} />
            {summaryOpen ? "Hide" : "Show"} order summary
            <ChevronDown className={cn("size-4 transition-transform duration-(--duration-spring) ease-spring", summaryOpen && "rotate-180")} />
          </span>
          <span className="type-heading-sm type-price">{formatPrice(bag.total, bag.currency)}</span>
        </button>
        <Expand open={summaryOpen}><div className="px-5 pb-5">{summary}</div></Expand>
      </div>

      <div className="grid content-start gap-tile">
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
              {!session && (
                <p className="rounded-lg bg-canvas px-4 py-3 type-body-sm text-ink-muted">
                  Have an account?{" "}
                  <Link href="/sign-in?next=/checkout" className="text-accent-ink underline underline-offset-2">Sign in</Link> for saved addresses.
                </p>
              )}
              <TextField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                disabled={!!session}
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
                      title: addresses.length ? "Use a new address" : "Shipping address",
                      details: (
                        <div className={addresses.length ? "border-t border-line pt-4" : undefined}>
                          <AddressForm
                            id="checkout-address"
                            initial={
                              initialBag.shippingAddress ??
                              (session ? { firstName: session.customer.firstName, lastName: session.customer.lastName, phone: session.customer.phone } : undefined)
                            }
                            onSubmit={async (a) => {
                              if (session && saveNew) {
                                const res = await saveAddress({ ...a, label: a.label ?? "Address" }, true)
                                if (res.ok) setAddressChoice(res.data.id)
                              }
                              submitContact(fields(a))
                            }}
                          >
                            {session && (
                              <Checkbox label="Save this address to my account" checked={saveNew} onCheckedChange={(v) => setSaveNew(v === true)} />
                            )}
                          </AddressForm>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
              <Button size="xl" onClick={continueFromInfo} loading={pending && step === 1} className="sm:justify-self-start sm:px-12">
                Continue to delivery
              </Button>
            </div>
          </StepCard>
        </div>

        <div id="step-2" className="scroll-mt-(--header-h)">
          <StepCard
            index={2}
            title="Delivery"
            state={stateOf(2)}
            onEdit={() => go(2)}
            summary={
              deliveryOption && (
                <p className="flex items-center gap-2 type-body-sm text-ink-muted">
                  <Truck className="size-4" strokeWidth={1.6} /> {deliveryOption.label}
                  {deliveryOption.description && `, ${deliveryOption.description.toLowerCase()}`} · {deliveryOption.price ? formatPrice(deliveryOption.price, bag.currency) : "Free"}
                </p>
              )
            }
          >
            <div className="grid gap-6">
              {options.length ? (
                <RadioCards
                  label="Delivery method"
                  value={delivery}
                  onValueChange={setDelivery}
                  options={options.map((o) => ({
                    value: o.id,
                    title: o.label,
                    description: o.description,
                    aside: o.price ? formatPrice(o.price, bag.currency) : "Free",
                  }))}
                />
              ) : (
                <p className="type-body-sm text-ink-muted">No delivery options are available for this address.</p>
              )}
              <Button size="xl" onClick={continueFromDelivery} loading={pending && step === 2} disabled={!options.length} className="sm:justify-self-start sm:px-12">
                Continue to payment
              </Button>
            </div>
          </StepCard>
        </div>

        <div id="step-3" className="scroll-mt-(--header-h)">
          <StepCard
            index={3}
            title="Payment"
            state={stateOf(3)}
            onEdit={() => go(3)}
            summary={
              <p className="flex items-center gap-2 type-body-sm text-ink-muted [&_svg]:size-4">
                {paymentIcon[paymentOption.id]} {payment === "upi" ? `UPI, ${upiId}` : paymentOption.label}
              </p>
            }
          >
            <div className="grid gap-6">
              <RadioCards
                label="Payment method"
                value={payment}
                onValueChange={setPayment}
                options={paymentMethods.map((p) => ({
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
              <Checkbox label="Billing address same as shipping" defaultChecked disabled />
              <Button size="xl" onClick={continueFromPayment} loading={pending && step === 3} className="sm:justify-self-start sm:px-12">
                Review order
              </Button>
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
                <span className="type-heading-md type-price">{formatPrice(bag.total, bag.currency)}</span>
              </div>
              <Button size="xl" block loading={placing} onClick={submitOrder}>
                <Lock strokeWidth={1.8} /> Place order
              </Button>
            </div>
          </StepCard>
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="panel sticky top-[calc(var(--header-h)+0.75rem)]">
          <h2 className="mb-5 type-title">Order summary</h2>
          {summary}
        </div>
      </aside>
    </div>
  )
}

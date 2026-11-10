"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useTransition, type ReactNode, type Ref } from "react"
import { AddressForm } from "@/components/account/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Expand } from "@/components/ui/expand"
import { ChevronDown, CreditCard, Info, Lock, ShoppingBag, Smartphone, Truck, Wallet } from "@/components/ui/icons"
import { RadioCards } from "@/components/ui/radio-cards"
import { TextField } from "@/components/ui/text-field"
import { toast } from "@/components/ui/toast"
import { placeOrder, setCheckoutContact, setPaymentMethod, setShippingMethod, type PaymentStart, type ShippingChoice } from "@/lib/data/cart"
import { saveAddress, type Session } from "@/lib/data/customer"
import { formatPrice } from "@/lib/format"
import { paymentMethods } from "@/lib/site"
import { setBag as setClientBag } from "@/lib/stores/bag"
import { emptyBag, type Address, type Bag } from "@/lib/types"
import { cn, revealInvalid, scrollBehavior } from "@/lib/utils"
import { ActionBar } from "./action-bar"
import { OrderSummary } from "./order-summary"
import { openRazorpay } from "./razorpay"
import { StepRecap, type RecapRow } from "./step-recap"
import { Stepper } from "./stepper"

type Step = "details" | "delivery" | "payment" | "review"
type AddressFields = Omit<Address, "id" | "isDefault" | "label">

const STEPS: { id: Step; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "delivery", label: "Delivery" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
]
const order = (s: Step) => STEPS.findIndex((x) => x.id === s)

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const paymentIcon: Record<string, ReactNode> = {
  upi: <Smartphone strokeWidth={1.6} />,
  card: <CreditCard strokeWidth={1.6} />,
  phonepe: <Smartphone strokeWidth={1.6} />,
  cod: <Wallet strokeWidth={1.6} />,
}

function fields(a: Address): AddressFields {
  return {
    firstName: a.firstName, lastName: a.lastName, phone: a.phone, line1: a.line1, line2: a.line2,
    city: a.city, state: a.state, postalCode: a.postalCode, country: a.country,
  }
}

function oneLine(a: AddressFields) {
  return [`${a.firstName} ${a.lastName}`.trim(), a.line1, a.line2, `${a.city} ${a.postalCode}`].filter(Boolean).join(", ")
}

function StepHeading({ title, description, ref }: { title: string; description?: string; ref?: Ref<HTMLHeadingElement> }) {
  return (
    <div className="mb-6">
      <h1 ref={ref} tabIndex={-1} className="type-heading-md outline-none md:type-heading-lg">{title}</h1>
      {description && <p className="mt-1.5 max-w-[60ch] type-body-sm text-ink-muted">{description}</p>}
    </div>
  )
}

export function CheckoutFlow({ initialBag, session, demo = false, storeCredit = 0 }: { initialBag: Bag; session: Session; demo?: boolean; storeCredit?: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const addresses = session?.addresses ?? []
  const [bag, setBagState] = useState(initialBag)
  const [step, setStep] = useState<Step>("details")
  const [direction, setDirection] = useState<"next" | "back">("next")
  const [email, setEmail] = useState(session?.customer.email ?? initialBag.email ?? "")
  const [emailError, setEmailError] = useState<string>()
  const [addressChoice, setAddressChoice] = useState<string>(addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "new")
  const [address, setAddress] = useState<AddressFields | null>(initialBag.shippingAddress ?? null)
  const [saveNew, setSaveNew] = useState(true)
  const [options, setOptions] = useState<ShippingChoice[]>([])
  const [delivery, setDelivery] = useState<string>(initialBag.shippingMethodId ?? "")
  const [payment, setPayment] = useState<string>("upi")
  const [paymentStart, setPaymentStart] = useState<PaymentStart>({ kind: "none" })
  const [pending, start] = useTransition()
  const [placing, setPlacing] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const stickyRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const shownStep = useRef(step)

  // On a new step, bring its choices into view under the sticky stepper
  // (the recap above stays one scroll up on phones) and move focus there.
  useEffect(() => {
    if (shownStep.current === step) return
    shownStep.current = step
    const heading = headingRef.current
    const sticky = stickyRef.current
    if (!heading || !sticky) return
    const desktop = window.matchMedia("(min-width: 64rem)").matches
    const target = desktop ? (sectionRef.current ?? heading) : heading
    const offset = parseFloat(getComputedStyle(sticky).top) + sticky.offsetHeight + 16
    const rectTop = target.getBoundingClientRect().top
    if (rectTop < offset || rectTop > window.innerHeight * 0.4) {
      window.scrollTo({ top: Math.max(0, rectTop + window.scrollY - offset), behavior: scrollBehavior() })
    }
    heading.focus({ preventScroll: true })
  }, [step])

  useEffect(() => {
    if (searchParams.get("payment") === "failed") toast("Payment was not completed. Choose a method and try again.", "error")
  }, [searchParams])

  const updateBag = (b: Bag) => {
    setBagState(b)
    setClientBag(b)
  }

  const go = (next: Step) => {
    setDirection(order(next) >= order(step) ? "next" : "back")
    setStep(next)
  }

  if (bag.lines.length === 0 && !placing) {
    return (
      <div className="panel mx-auto mt-6 grid max-w-lg animate-rise-in place-items-center py-16 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-surface-muted text-ink-muted"><ShoppingBag className="size-6" strokeWidth={1.4} /></span>
        <h1 className="mt-5 type-heading-md">Your bag is empty</h1>
        <p className="mt-1 type-body-sm text-ink-muted">Add a few pieces, then come back to check out.</p>
        <Button asChild className="mt-6"><Link href="/collections/new-arrivals">Shop new in</Link></Button>
      </div>
    )
  }

  const total = formatPrice(bag.total, bag.currency)
  const deliveryOption = options.find((o) => o.id === delivery)
  // Gift card codes are issued when the order is placed, so the backend refuses them with cash on delivery.
  const hasGiftCard = bag.lines.some((l) => l.giftCard)
  const methods = hasGiftCard ? paymentMethods.filter((p) => p.id !== "cod") : paymentMethods
  const paymentOption = methods.find((p) => p.id === payment) ?? methods[0]
  const covered = bag.total <= 0
  const steps = bag.needsShipping === false ? STEPS.filter((s) => s.id !== "delivery") : STEPS

  const submitContact = (a: AddressFields) =>
    start(async () => {
      const res = await setCheckoutContact({ email, address: a })
      if (!res.ok) return void toast(res.error, "error")
      updateBag(res.data.bag)
      setAddress(a)
      setOptions(res.data.shipping)
      if (!res.data.shipping.some((o) => o.id === delivery)) setDelivery(res.data.shipping[0]?.id ?? "")
      go(res.data.bag.needsShipping === false ? "payment" : "delivery")
    })

  const continueFromDetails = () => {
    if (!EMAIL.test(email)) {
      setEmailError("Enter a valid email")
      return revealInvalid(document)
    }
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
      go("payment")
    })

  const continueFromPayment = () =>
    start(async () => {
      const res = await setPaymentMethod(paymentOption.id)
      if (!res.ok) return void toast(res.error, "error")
      updateBag(res.data.bag)
      setPaymentStart(res.data.payment)
      go("review")
    })

  const complete = () =>
    start(async () => {
      const res = await placeOrder()
      if (!res.ok) {
        setPlacing(false)
        return void toast(res.error, "error")
      }
      setClientBag(emptyBag)
      router.push(`/checkout/confirmed?order=${res.data.orderId}`)
    })

  const submitOrder = async () => {
    setPlacing(true)
    if (paymentStart.kind === "redirect") return void window.location.assign(paymentStart.url)
    if (paymentStart.kind !== "razorpay") return complete()
    try {
      await openRazorpay(paymentStart, {
        email,
        phone: address?.phone,
        name: address ? `${address.firstName} ${address.lastName}`.trim() : undefined,
        method: payment,
        onPaid: complete,
        onClose: () => setPlacing(false),
      })
    } catch {
      setPlacing(false)
      toast("Could not open the payment window. Check your connection and try again.", "error")
    }
  }

  const recap: RecapRow[] = [
    { label: "Contact", value: email, onEdit: () => go("details") },
    ...(address ? [{ label: "Ship to", value: oneLine(address), onEdit: () => go("details") }] : []),
    ...(order(step) > order("delivery") && deliveryOption
      ? [{
          label: "Delivery",
          value: `${deliveryOption.label} · ${deliveryOption.price ? formatPrice(deliveryOption.price, bag.currency) : "Free"}`,
          onEdit: () => go("delivery"),
        }]
      : []),
    ...(step === "review" ? [{ label: "Payment", value: covered ? "Gift card or store credit" : paymentOption.label, onEdit: () => go("payment") }] : []),
  ]

  const nextNote =
    paymentStart.kind === "razorpay"
      ? "A secure Razorpay window opens to finish your payment."
      : paymentStart.kind === "redirect"
        ? "You will finish paying on PhonePe, then come straight back here."
        : paymentOption.id === "cod" && !covered
          ? `Keep ${total} ready when your order arrives.`
          : null

  const summary = <OrderSummary bag={bag} onBag={updateBag} storeCredit={storeCredit} />

  return (
    <>
      <div ref={stickyRef} className="sticky top-(--header-h) z-(--z-sheet) -mx-gutter bg-canvas px-gutter pt-1 pb-3 md:pt-3">
        <div className="mx-auto max-w-6xl">
          <Stepper steps={steps} current={step} onJump={pending || placing ? undefined : go} />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-tile pt-4 pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:gap-10 lg:pt-6 lg:pb-0">
        <div className="panel p-0 lg:hidden">
          <button onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} className="flex w-full items-center justify-between gap-3 p-5">
            <span className="flex items-center gap-2 type-body-sm text-accent-ink">
              <ShoppingBag className="size-4" strokeWidth={1.6} />
              {summaryOpen ? "Hide" : "Show"} order summary
              <ChevronDown className={cn("size-4 transition-transform duration-(--duration-spring) ease-spring", summaryOpen && "rotate-180")} />
            </span>
            <span className="type-heading-sm type-price">{total}</span>
          </button>
          <Expand open={summaryOpen}><div className="px-5 pb-5">{summary}</div></Expand>
        </div>

        <section ref={sectionRef} className="min-w-0 overflow-x-clip">
          {step !== "details" && step !== "review" && <StepRecap rows={recap} className="mb-8" />}

          <div key={step} className={direction === "next" ? "animate-step-next" : "animate-step-back"}>
            {step === "details" && (
              <>
                <StepHeading ref={headingRef} title="Your details" description="Where should we send your order and its updates?" />
                <div className="grid gap-6">
                  {!session && (
                    <p className="rounded-lg bg-surface px-4 py-3 type-body-sm text-ink-muted ring-1 ring-line ring-inset">
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
                    <p className="type-title">Shipping address</p>
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
                          title: addresses.length ? "Use a new address" : "New address",
                          details: (
                            <div className={addresses.length ? "border-t border-line pt-4" : undefined}>
                              <AddressForm
                                id="checkout-address"
                                initial={
                                  address ??
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
                </div>
                <ActionBar total={total}>
                  <Button size="xl" onClick={continueFromDetails} loading={pending} className="lg:w-full">Continue to delivery</Button>
                </ActionBar>
              </>
            )}

            {step === "delivery" && (
              <>
                <StepHeading ref={headingRef} title="Delivery method" />
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
                  <div className="grid justify-items-center rounded-xl px-6 py-10 text-center ring-1 ring-line-strong ring-inset">
                    <Truck className="size-6 text-ink-muted" strokeWidth={1.4} />
                    <p className="mt-3 type-body font-medium">We can&apos;t deliver here yet</p>
                    <p className="mt-1 max-w-[40ch] type-body-sm text-ink-muted">There are no delivery options for this address. Go back and check the PIN code.</p>
                  </div>
                )}
                <ActionBar total={total}>
                  <Button size="xl" onClick={continueFromDelivery} loading={pending} disabled={!options.length} className="lg:w-full">
                    Continue to payment
                  </Button>
                </ActionBar>
              </>
            )}

            {step === "payment" && (
              <>
                <StepHeading ref={headingRef} title="Payment" description="Choose how you'd like to pay. You confirm the amount on the next step." />
                {covered ? (
                  <p className="rounded-lg bg-success-soft px-4 py-3 type-body-sm text-success">Your gift card or store credit covers this order. Nothing more to pay.</p>
                ) : (
                <RadioCards
                  label="Payment method"
                  value={paymentOption.id}
                  onValueChange={setPayment}
                  options={methods.map((p) => ({
                    value: p.id,
                    title: p.label,
                    description: p.description,
                    aside: <span className="text-ink-muted [&_svg]:size-5">{paymentIcon[p.id]}</span>,
                  }))}
                />
                )}
                {hasGiftCard && !covered && <p className="mt-3 type-caption text-ink-muted">Cash on delivery is not available for gift cards.</p>}
                <div className="mt-5">
                  <Checkbox label="Billing address same as shipping" defaultChecked disabled />
                </div>
                <ActionBar total={total}>
                  <Button size="xl" onClick={continueFromPayment} loading={pending} className="lg:w-full">Review order</Button>
                </ActionBar>
              </>
            )}

            {step === "review" && (
              <>
                <StepHeading ref={headingRef} title="Review and pay" />
                <StepRecap rows={recap} />
                {demo && (
                  <p className="mt-5 rounded-lg bg-accent-soft px-4 py-3 type-body-sm text-accent-soft-ink">
                    Demo store: this places a sample order in your browser only. Nothing is charged or shipped.
                  </p>
                )}
                {nextNote && (
                  <p className="mt-5 flex items-start gap-3 rounded-lg bg-surface px-4 py-3.5 type-body-sm text-ink-muted ring-1 ring-line ring-inset">
                    <Info className="mt-px size-4 shrink-0" strokeWidth={1.6} />
                    {nextNote}
                  </p>
                )}
                <p className="mt-5 type-caption text-ink-muted">
                  By placing your order you agree to our{" "}
                  <Link href="/terms" className="text-ink underline underline-offset-2">terms</Link> and{" "}
                  <Link href="/help/returns" className="text-ink underline underline-offset-2">returns policy</Link>.
                </p>
                <ActionBar total={total}>
                  <Button size="xl" loading={placing} onClick={submitOrder} className="lg:w-full">
                    <Lock strokeWidth={1.8} /> {paymentStart.kind === "none" ? "Place order" : `Pay ${total}`}
                  </Button>
                </ActionBar>
              </>
            )}
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="panel sticky top-[calc(var(--header-h)+5rem)]">
            <h2 className="mb-5 type-title">Order summary</h2>
            {summary}
          </div>
        </aside>
      </div>
    </>
  )
}

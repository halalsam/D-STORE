"use client"

import type { PaymentStart } from "@/lib/data/cart"

type RazorpayOptions = Record<string, unknown> & { handler: () => void; modal: { ondismiss: () => void } }
type RazorpayInstance = { open: () => void; on: (event: string, cb: () => void) => void }
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"
let loading: Promise<void> | undefined

function load() {
  if (window.Razorpay) return Promise.resolve()
  loading ??= new Promise<void>((resolve, reject) => {
    const el = document.createElement("script")
    el.src = SCRIPT
    el.async = true
    el.onload = () => resolve()
    el.onerror = () => {
      loading = undefined
      reject(new Error("Razorpay failed to load"))
    }
    document.head.appendChild(el)
  })
  return loading
}

export async function openRazorpay(
  start: Extract<PaymentStart, { kind: "razorpay" }>,
  opts: { email: string; phone?: string; name?: string; method: string; onPaid: () => void; onClose: () => void }
) {
  await load()
  const rzp = new window.Razorpay!({
    key: start.keyId,
    order_id: start.orderId,
    amount: start.amount,
    currency: start.currency,
    name: "MotionFit",
    prefill: { email: opts.email, contact: opts.phone, name: opts.name, ...(opts.method === "upi" ? { method: "upi" } : {}) },
    theme: { color: "#0A1730" },
    handler: opts.onPaid,
    modal: { ondismiss: opts.onClose },
  })
  rzp.on("payment.failed", opts.onClose)
  rzp.open()
}

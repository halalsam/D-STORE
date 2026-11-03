export const deliveryOptions = [
  { id: "standard", label: "Standard delivery", description: "3 to 5 business days", price: 0 },
  { id: "express", label: "Express delivery", description: "1 to 2 business days, metro cities", price: 250 },
  { id: "pickup", label: "Pick up in store", description: "D-STORE Bandra, ready in 24 hours", price: 0 },
] as const

export const paymentOptions = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm or any UPI app" },
  { id: "card", label: "Credit or debit card", description: "Visa, Mastercard, RuPay, Amex" },
  { id: "cod", label: "Cash on delivery", description: "Pay when your order arrives" },
] as const

/** Mock promo codes. TODO: Medusa promotions (cart.promo_codes). */
export const promoCodes: Record<string, { label: string; percent: number }> = {
  WELCOME10: { label: "WELCOME10", percent: 10 },
}

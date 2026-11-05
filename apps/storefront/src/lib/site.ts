import type { ColorFamily } from "./types"

/** Static navigation and filter config (not catalog data). */

export const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "in"

export const colorFamilies: { name: ColorFamily; swatches: string[] }[] = [
  { name: "Blues", swatches: ["#7EA6E0", "#4F6FD1", "#2F4BB0", "#1E2F7A"] },
  { name: "Browns", swatches: ["#D9C2AE", "#A9846A", "#7A563F", "#4A3326"] },
  { name: "Greens", swatches: ["#9FD8B0", "#4FB878", "#2E8A55", "#1F5E3B"] },
  { name: "Neutrals", swatches: ["#F4F1EC", "#B8B5B0", "#6E6C69", "#1E1E1E"] },
  { name: "Purples", swatches: ["#E3A7E8", "#C66AD6", "#9A47C4", "#6B2FA0"] },
  { name: "Reds", swatches: ["#F2B04B", "#E8713C", "#C9412F", "#8E1F1F"] },
]

export const productTypes = ["T-shirt", "Polo", "Shirt", "Hoodie", "Sweater", "Jacket", "Joggers", "Shorts", "Bag", "Card case", "Cap"] as const

export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

/** Checkout payment choices; lib/data/cart.ts maps each to a Medusa payment provider. */
export const paymentMethods = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm or any UPI app, via Razorpay" },
  { id: "card", label: "Card, netbanking or wallet", description: "Visa, Mastercard, RuPay, Amex and more, via Razorpay" },
  { id: "phonepe", label: "PhonePe", description: "Pay on PhonePe's secure page" },
  { id: "cod", label: "Cash on delivery", description: "Pay when your order arrives" },
] as const

/** Shown on the empty search page. Keep to terms that return results. */
export const popularSearches = ["Godzilla", "Polo", "Hoodie", "Denim jacket", "Backpack", "Joggers", "Knit", "Cap"]

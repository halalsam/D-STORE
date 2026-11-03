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

export const productTypes = ["T-shirt", "Shirt", "Hoodie", "Bag", "Cap"] as const

export const menu = {
  collections: [
    { label: "BLUORNG x Godzilla", href: "/collections/bluorng-x-godzilla" },
    { label: "New Arrivals", href: "/collections/new-arrivals" },
    { label: "Coastline Collection", href: "/collections/coastline" },
    { label: "Essentials", href: "/collections/essentials" },
    { label: "Bags and Accessories", href: "/collections/accessories" },
  ],
  groups: [
    { title: "Top", links: ["T-Shirts", "Polos", "Shirts", "Sweatshirts", "Hoodies", "Jackets"] },
    { title: "Bottom", links: ["Cargos", "Jeans", "Trousers", "Shorts"] },
    { title: "Accessories", links: ["Bags", "Caps", "Card cases"] },
  ],
}

export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

/** UI payment choices. All settle through the region's Medusa payment provider for now. */
export const paymentMethods = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm or any UPI app" },
  { id: "card", label: "Credit or debit card", description: "Visa, Mastercard, RuPay, Amex" },
  { id: "cod", label: "Cash on delivery", description: "Pay when your order arrives" },
] as const

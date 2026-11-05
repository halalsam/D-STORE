/**
 * Storefront view models. Medusa responses are mapped into these in
 * src/lib/data/adapters.ts so components never depend on API shapes.
 */

export type Tone = readonly [string, string]
export type Silhouette = "tee" | "shirt" | "hoodie" | "bag" | "cap" | "card"
export type ColorFamily = "Blues" | "Browns" | "Greens" | "Neutrals" | "Purples" | "Reds"

export type Size = { label: string; available: boolean; variantId: string; price?: number }

export type Product = {
  id: string
  handle: string
  title: string
  price: number
  compareAt?: number
  currency: string
  collection: string
  collectionTitle?: string
  category: string
  type: string
  color?: ColorFamily
  silhouette: Silhouette
  tones: readonly Tone[]
  images: string[]
  sizes: Size[]
  badge?: string
  description: string
  washcare: string[]
  /**
   * Garment measurements in inches. Undefined: no product-specific chart, show
   * the generic one. Null: the product has no size guide (bags, caps).
   */
  sizeChart?: SizeChart | null
  /** Digital gift card: the "sizes" are amounts, emailed after checkout. */
  giftCard?: boolean
}

export type SizeChart = { columns: string[]; rows: string[][] }

export type ReviewStats = {
  average: number
  count: number
  /** Count per star, index 0 = 1 star. */
  distribution: [number, number, number, number, number]
}

export type Review = {
  id: string
  name: string
  rating: number
  content: string
  createdAt: string
  images: string[]
  response?: string
}

/** What the signed-in shopper can do about reviewing a product. */
export type ReviewEligibility =
  | { kind: "signed-out" }
  | { kind: "not-purchased" }
  | {
      kind: "can-review"
      orderId: string
      lineId: string
      existing?: { rating: number; content: string; images: string[]; status: "pending" | "approved" | "flagged" }
    }

export type Collection = {
  id: string
  handle: string
  title: string
  blurb: string
  tone: Tone
  /** Campaign banner, landscape. */
  image?: string
  /** Portrait crop of the banner for phones. */
  imageMobile?: string
}

export type Address = {
  id: string
  label?: string
  firstName: string
  lastName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault?: boolean
}

export type Customer = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  marketing: boolean
  orderUpdatesSms: boolean
  /** Guest orders with this email are only moved into the account once the email is verified. */
  emailVerified: boolean
}

export type OrderStatus = "placed" | "packed" | "shipped" | "delivered" | "cancelled"

export type OrderLine = {
  id?: string
  handle: string
  title: string
  size: string
  quantity: number
  unitPrice: number
  tone: Tone
  silhouette: Silhouette
  thumbnail?: string
  giftCard?: { recipientEmail?: string; recipientName?: string; message?: string }
}

export type Order = {
  id: string
  displayId: string
  createdAt: string
  status: OrderStatus
  email: string
  lines: OrderLine[]
  shippingAddress: Omit<Address, "id" | "isDefault" | "label">
  delivery: { id: string; label: string; price: number }
  payment: { id: string; label: string }
  subtotal: number
  discount: number
  shipping: number
  total: number
  currency: string
  tracking?: string
}

/** A bag line, from a Medusa cart line item. */
export type BagLine = OrderLine & { key: string; variantId: string }

export type Bag = {
  id: string | null
  lines: BagLine[]
  count: number
  subtotal: number
  discount: number
  shipping: number | null
  total: number
  promoCodes: string[]
  email?: string
  shippingAddress?: Omit<Address, "id" | "isDefault" | "label">
  shippingMethodId?: string
  currency: string
  /** Gift card codes applied to the bag. */
  giftCards?: string[]
  /** Gift card and store credit applied, taken off the total. */
  credit?: number
  storeCreditApplied?: boolean
  /** False when the bag only holds digital items (gift cards). */
  needsShipping?: boolean
}

export const emptyBag: Bag = {
  id: null,
  lines: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  shipping: null,
  total: 0,
  promoCodes: [],
  currency: "inr",
}

export function isSoldOut(p: Product) {
  return p.sizes.every((s) => !s.available)
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string }

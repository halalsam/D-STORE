import type { HttpTypes } from "@medusajs/types"
import type {
  Address,
  Bag,
  BagLine,
  Collection,
  ColorFamily,
  Customer,
  Order,
  OrderLine,
  OrderStatus,
  Product,
  Silhouette,
  Tone,
} from "@/lib/types"

/**
 * Medusa -> storefront view models.
 * Product presentation data (placeholder tones, silhouette, washcare,
 * badge) lives in product metadata, set by the backend seed and editable
 * in the admin under the product's Metadata section.
 */

const FALLBACK_TONE: Tone = ["#2F4156", "#567C8D"]
const SILHOUETTES: Silhouette[] = ["tee", "shirt", "hoodie", "bag", "cap"]

type Meta = Record<string, unknown> | null | undefined

function str(meta: Meta, key: string) {
  const v = meta?.[key]
  return typeof v === "string" ? v : undefined
}

function tones(meta: Meta): Tone[] {
  const v = meta?.tones
  if (Array.isArray(v) && v.every((t) => Array.isArray(t) && t.length === 2)) return v as Tone[]
  return [FALLBACK_TONE]
}

function silhouette(meta: Meta): Silhouette {
  const s = str(meta, "silhouette")
  return SILHOUETTES.includes(s as Silhouette) ? (s as Silhouette) : "tee"
}

export function toProduct(p: HttpTypes.StoreProduct): Product {
  const meta = p.metadata
  const variants = [...(p.variants ?? [])].sort((a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0))
  const prices = variants.map((v) => v.calculated_price).filter((c) => c?.calculated_amount != null)
  const cheapest = prices.sort((a, b) => (a!.calculated_amount ?? 0) - (b!.calculated_amount ?? 0))[0]
  const price = cheapest?.calculated_amount ?? 0
  const original = cheapest?.original_amount ?? price

  return {
    id: p.id,
    handle: p.handle ?? p.id,
    title: p.title ?? "",
    price,
    compareAt: original > price ? original : undefined,
    currency: cheapest?.currency_code ?? "inr",
    collection: p.collection?.handle ?? "",
    collectionTitle: p.collection?.title,
    category: p.categories?.[0]?.handle ?? "",
    type: str(meta, "type") ?? p.type?.value ?? "",
    color: str(meta, "color") as ColorFamily | undefined,
    silhouette: silhouette(meta),
    tones: tones(meta),
    images: (p.images ?? []).map((i) => i.url).filter(Boolean),
    sizes: variants.map((v) => ({
      label: v.title ?? "",
      variantId: v.id,
      available: !v.manage_inventory || v.allow_backorder || (v.inventory_quantity ?? 0) > 0,
    })),
    badge: str(meta, "badge"),
    description: p.description ?? "",
    washcare: Array.isArray(meta?.washcare) ? (meta.washcare as string[]) : [],
  }
}

export function toCollection(c: HttpTypes.StoreCollection): Collection {
  const tone = c.metadata?.tone
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    blurb: str(c.metadata, "blurb") ?? "",
    tone: Array.isArray(tone) && tone.length === 2 ? (tone as unknown as Tone) : FALLBACK_TONE,
  }
}

type LineLike = {
  id: string
  variant_id?: string | null
  product_handle?: string | null
  product_title?: string | null
  title?: string
  variant_title?: string | null
  quantity: number
  unit_price: number
  thumbnail?: string | null
  metadata?: Meta
}

function toLine(i: LineLike): OrderLine {
  const meta = i.metadata
  const tone = Array.isArray(meta?.tone) ? (meta.tone as unknown as Tone) : FALLBACK_TONE
  return {
    id: i.id,
    handle: i.product_handle ?? "",
    title: i.product_title ?? i.title ?? "",
    size: i.variant_title ?? "",
    quantity: i.quantity,
    unitPrice: i.unit_price,
    tone,
    silhouette: silhouette(meta),
    thumbnail: i.thumbnail ?? undefined,
  }
}

type AddressLike = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

const COUNTRY_NAMES: Record<string, string> = { in: "India" }

export function toAddressFields(a: AddressLike): Omit<Address, "id" | "isDefault" | "label"> {
  return {
    firstName: a.first_name ?? "",
    lastName: a.last_name ?? "",
    phone: a.phone ?? "",
    line1: a.address_1 ?? "",
    line2: a.address_2 ?? undefined,
    city: a.city ?? "",
    state: a.province ?? "",
    postalCode: a.postal_code ?? "",
    country: COUNTRY_NAMES[a.country_code ?? ""] ?? (a.country_code ?? "").toUpperCase(),
  }
}

/** Storefront address -> Medusa address payload. */
export function toMedusaAddress(a: Omit<Address, "id" | "isDefault" | "label">) {
  return {
    first_name: a.firstName,
    last_name: a.lastName,
    phone: a.phone,
    address_1: a.line1,
    address_2: a.line2 ?? "",
    city: a.city,
    province: a.state,
    postal_code: a.postalCode,
    country_code: "in",
  }
}

export function toCustomerAddress(a: HttpTypes.StoreCustomerAddress): Address {
  return {
    id: a.id,
    label: a.address_name ?? undefined,
    isDefault: a.is_default_shipping,
    ...toAddressFields(a),
  }
}

export function toCustomer(c: HttpTypes.StoreCustomer): Customer {
  return {
    id: c.id,
    firstName: c.first_name ?? "",
    lastName: c.last_name ?? "",
    email: c.email,
    phone: c.phone ?? "",
    marketing: c.metadata?.marketing !== false,
    orderUpdatesSms: c.metadata?.order_updates_sms === true,
  }
}

export function toBag(cart: HttpTypes.StoreCart | null | undefined): Bag {
  if (!cart) {
    return { id: null, lines: [], count: 0, subtotal: 0, discount: 0, shipping: null, total: 0, promoCodes: [], currency: "inr" }
  }
  const lines: BagLine[] = [...(cart.items ?? [])]
    .sort((a, b) => String(a.created_at ?? "").localeCompare(String(b.created_at ?? "")))
    .map((i) => ({ ...toLine(i), key: i.id, variantId: i.variant_id ?? "" }))
  const method = cart.shipping_methods?.[0]
  return {
    id: cart.id,
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: cart.item_subtotal ?? 0,
    discount: cart.discount_total ?? 0,
    shipping: method ? cart.shipping_total ?? 0 : null,
    total: cart.total ?? 0,
    promoCodes: (cart.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c),
    email: cart.email ?? undefined,
    shippingAddress: cart.shipping_address?.address_1 ? toAddressFields(cart.shipping_address) : undefined,
    shippingMethodId: method?.shipping_option_id ?? undefined,
    currency: cart.currency_code ?? "inr",
  }
}

function orderStatus(o: HttpTypes.StoreOrder): OrderStatus {
  if (o.status === "canceled") return "cancelled"
  switch (o.fulfillment_status) {
    case "delivered":
    case "partially_delivered":
      return "delivered"
    case "shipped":
    case "partially_shipped":
      return "shipped"
    case "fulfilled":
    case "partially_fulfilled":
      return "packed"
    default:
      return "placed"
  }
}

const PAYMENT_LABELS: Record<string, string> = { upi: "UPI", card: "Card", cod: "Cash on delivery" }

export type PaymentChoice = { payment_method: string | null; upi_id: string | null }

export function toOrder(o: HttpTypes.StoreOrder, payment?: PaymentChoice): Order {
  const method = o.shipping_methods?.[0]
  const paymentMethod = payment?.payment_method ?? str(o.metadata, "payment_method")
  const upi = payment?.upi_id ?? str(o.metadata, "upi_id")
  const tracking = o.fulfillments
    ?.flatMap((f) => (f as { labels?: { tracking_number?: string }[] }).labels ?? [])
    .find((l) => l.tracking_number)?.tracking_number
  return {
    id: o.id,
    displayId: o.display_id ? `DS-${String(o.display_id).padStart(5, "0")}` : `DS-${o.id.slice(-6).toUpperCase()}`,
    createdAt: String(o.created_at),
    status: orderStatus(o),
    email: o.email ?? "",
    lines: (o.items ?? []).map(toLine),
    shippingAddress: toAddressFields(o.shipping_address ?? {}),
    delivery: { id: method?.shipping_option_id ?? "", label: method?.name ?? "Delivery", price: method?.amount ?? 0 },
    payment: {
      id: paymentMethod ?? "manual",
      label: paymentMethod ? `${PAYMENT_LABELS[paymentMethod] ?? paymentMethod}${upi ? ` (${upi})` : ""}` : "Online payment",
    },
    subtotal: o.item_subtotal ?? 0,
    discount: o.discount_total ?? 0,
    shipping: o.shipping_total ?? 0,
    total: o.total ?? 0,
    currency: o.currency_code ?? "inr",
    tracking,
  }
}

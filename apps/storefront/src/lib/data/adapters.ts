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
const SILHOUETTES: Silhouette[] = ["tee", "shirt", "hoodie", "bag", "cap", "card"]

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
      price: v.calculated_price?.calculated_amount ?? undefined,
    })),
    badge: str(meta, "badge"),
    description: p.description ?? "",
    washcare: Array.isArray(meta?.washcare) ? (meta.washcare as string[]) : [],
    giftCard: p.is_giftcard || undefined,
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

function toLine(i: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem): OrderLine {
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
    giftCard: meta?.gift_card === true
      ? { recipientEmail: str(meta, "gift_recipient_email"), recipientName: str(meta, "gift_recipient_name"), message: str(meta, "gift_message") }
      : undefined,
  }
}

type MedusaAddress = Partial<HttpTypes.StoreCartAddress | HttpTypes.StoreOrderAddress | HttpTypes.StoreCustomerAddress>

const COUNTRY_NAMES: Record<string, string> = { in: "India" }

export function toAddressFields(a: MedusaAddress): Omit<Address, "id" | "isDefault" | "label"> {
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
    emailVerified: typeof c.metadata?.email_verified_at === "string",
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
    giftCards: ((cart as CartWithLoyalty).gift_cards ?? []).map((g) => g.code),
    credit: Number((cart as CartWithLoyalty).credit_line_total ?? 0),
    storeCreditApplied: ((cart as CartWithLoyalty).credit_lines ?? []).some((l) => l.reference === "store-credit"),
    needsShipping: (cart.items ?? []).some((i) => (i as { requires_shipping?: boolean }).requires_shipping !== false),
  }
}

/** Fields the loyalty plugin adds to the store cart (apps/backend medusa-config: @medusajs/loyalty-plugin). */
type CartWithLoyalty = HttpTypes.StoreCart & { gift_cards?: { code: string }[]; credit_line_total?: number; credit_lines?: { reference?: string }[] }

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

const PAYMENT_LABELS: Record<string, string> = { upi: "UPI", card: "Card, netbanking or wallet", phonepe: "PhonePe", cod: "Cash on delivery", gift_card: "Gift card or store credit" }

/** Response of the custom GET /store/orders/:id/payment-method route (apps/backend). */
export type StoreOrderPaymentMethodResponse = { payment_method: string | null; upi_id: string | null }

/** Store order fulfillments carry labels when requested via "*fulfillments.labels"; HttpTypes omits them. */
type FulfillmentWithLabels = HttpTypes.StoreOrderFulfillment & { labels?: { tracking_number?: string | null }[] }

export function toOrder(o: HttpTypes.StoreOrder, payment?: StoreOrderPaymentMethodResponse): Order {
  const method = o.shipping_methods?.[0]
  const paymentMethod = payment?.payment_method ?? str(o.metadata, "payment_method")
  const upi = payment?.upi_id ?? str(o.metadata, "upi_id")
  const tracking = o.fulfillments
    ?.flatMap((f) => (f as FulfillmentWithLabels).labels ?? [])
    .find((l) => l.tracking_number)?.tracking_number ?? undefined
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

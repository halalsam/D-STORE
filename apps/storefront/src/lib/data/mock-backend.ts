import "server-only"
import { cookies } from "next/headers"
import catalog from "@/lib/mock/catalog.json"
import type {
  ActionResult,
  Address,
  Bag,
  BagLine,
  Collection,
  ColorFamily,
  Customer,
  Order,
  Product,
  Review,
  ReviewStats,
  Silhouette,
  SizeChart,
  Tone,
} from "@/lib/types"

/**
 * DEMO MODE BACKEND
 * Used when MEDUSA_BACKEND_URL is not set (e.g. a Vercel preview without a
 * backend). Catalog comes from the bundled lib/mock/catalog.json (real
 * BLUORNG collections, photos hotlinked from cdn.shopify.com);
 * cart, customer, addresses and orders live in httpOnly cookies, so the
 * whole flow works per browser. Nothing is persisted server side and no
 * real orders are placed.
 */

type Fields = Omit<Address, "id" | "isDefault" | "label">

const COOKIE = { cart: "_dstore_demo_cart", customer: "_dstore_demo_customer", addresses: "_dstore_demo_addresses", orders: "_dstore_demo_orders" }
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 }

async function read<T>(name: string, fallback: T): Promise<T> {
  const raw = (await cookies()).get(name)?.value
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function write(name: string, value: unknown) {
  ;(await cookies()).set(name, JSON.stringify(value), cookieOptions)
}

// Catalog ---------------------------------------------------------------

const collectionTitle = (handle: string) => catalog.collections.find((c) => c.handle === handle)?.title

const PRODUCTS: Product[] = catalog.products.map((p) => ({
  id: `demo_${p.handle}`,
  handle: p.handle,
  title: p.title,
  price: p.price,
  compareAt: "compareAt" in p && typeof p.compareAt === "number" ? p.compareAt : undefined,
  currency: "inr",
  collection: p.collection,
  collectionTitle: collectionTitle(p.collection),
  category: p.category,
  type: p.type,
  color: p.color as ColorFamily,
  silhouette: p.silhouette as Silhouette,
  tones: p.tones as unknown as Tone[],
  images: "images" in p && Array.isArray(p.images) ? p.images : [],
  sizes: p.sizes.map((s) => ({ label: s.label, available: s.stock > 0, variantId: `${p.handle}::${s.label}` })),
  badge: "badge" in p && typeof p.badge === "string" ? p.badge : undefined,
  description: p.description,
  washcare: p.washcare,
  sizeChart: "sizeChart" in p && p.sizeChart ? (p.sizeChart as SizeChart) : null,
}))

const COLLECTIONS: Collection[] = catalog.collections.map((c) => ({
  id: `demo_${c.handle}`,
  handle: c.handle,
  title: c.title,
  blurb: c.blurb,
  tone: c.tone as unknown as Tone,
  image: "image" in c && typeof c.image === "string" ? c.image : undefined,
  imageMobile: "imageMobile" in c && typeof c.imageMobile === "string" ? c.imageMobile : undefined,
}))

export const demoCatalog = {
  collections: () => COLLECTIONS,
  products: (collectionHandle?: string) => PRODUCTS.filter((p) => !collectionHandle || p.collection === collectionHandle),
  product: (handle: string) => PRODUCTS.find((p) => p.handle === handle) ?? null,
}

function variant(variantId: string) {
  const [handle, size] = variantId.split("::")
  const product = PRODUCTS.find((p) => p.handle === handle)
  const s = product?.sizes.find((x) => x.label === size)
  return product && s ? { product, size: s } : null
}

// Cart ------------------------------------------------------------------

export const SHIPPING = [
  { id: "standard", label: "Standard delivery", description: "3 to 5 business days", price: 0 },
  { id: "express", label: "Express delivery", description: "1 to 2 business days, metro cities", price: 250 },
  { id: "pickup", label: "Pick up in store", description: "MotionFit Bandra, ready in 24 hours", price: 0 },
]
const PROMOS: Record<string, number> = { WELCOME10: 10 }

type DemoCart = {
  lines: { v: string; q: number }[]
  promo?: string
  email?: string
  address?: Fields
  shipping?: string
  payment?: { method: string; upi?: string }
}

const emptyCart = (): DemoCart => ({ lines: [] })

function toBag(cart: DemoCart): Bag {
  const lines: BagLine[] = []
  for (const l of cart.lines) {
    const hit = variant(l.v)
    if (!hit) continue
    lines.push({
      id: l.v,
      key: l.v,
      variantId: l.v,
      handle: hit.product.handle,
      title: hit.product.title,
      size: hit.size.label,
      quantity: l.q,
      unitPrice: hit.product.price,
      tone: hit.product.tones[0],
      silhouette: hit.product.silhouette,
      thumbnail: hit.product.images[0],
    })
  }
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0)
  const discount = cart.promo ? Math.round((subtotal * (PROMOS[cart.promo] ?? 0)) / 100) : 0
  const ship = SHIPPING.find((s) => s.id === cart.shipping)
  return {
    id: lines.length ? "demo_cart" : null,
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotal,
    discount,
    shipping: ship ? ship.price : null,
    total: subtotal - discount + (ship?.price ?? 0),
    promoCodes: cart.promo ? [cart.promo] : [],
    email: cart.email,
    shippingAddress: cart.address,
    shippingMethodId: cart.shipping,
    currency: "inr",
  }
}

const getCart = () => read<DemoCart>(COOKIE.cart, emptyCart())

async function updateCart(fn: (c: DemoCart) => DemoCart): Promise<Bag> {
  const next = fn(await getCart())
  await write(COOKIE.cart, next)
  return toBag(next)
}

export const demoCart = {
  read: async () => toBag(await getCart()),
  add: async (variantId: string, quantity: number): Promise<ActionResult<Bag>> => {
    const hit = variant(variantId)
    if (!hit || !hit.size.available) return { ok: false, error: "That size is sold out" }
    const bag = await updateCart((c) => {
      const existing = c.lines.find((l) => l.v === variantId)
      const lines = existing ? c.lines.map((l) => (l.v === variantId ? { ...l, q: l.q + quantity } : l)) : [...c.lines, { v: variantId, q: quantity }]
      return { ...c, lines }
    })
    return { ok: true, data: bag }
  },
  update: async (lineId: string, quantity: number): Promise<ActionResult<Bag>> => ({
    ok: true,
    data: await updateCart((c) => ({
      ...c,
      lines: quantity <= 0 ? c.lines.filter((l) => l.v !== lineId) : c.lines.map((l) => (l.v === lineId ? { ...l, q: quantity } : l)),
    })),
  }),
  applyPromo: async (code: string): Promise<ActionResult<Bag>> => {
    const upper = code.toUpperCase()
    if (!PROMOS[upper]) return { ok: false, error: "That code is not valid" }
    return { ok: true, data: await updateCart((c) => ({ ...c, promo: upper })) }
  },
  removePromo: async (): Promise<ActionResult<Bag>> => ({ ok: true, data: await updateCart((c) => ({ ...c, promo: undefined })) }),
  setContact: async (email: string, address: Fields) => ({
    ok: true as const,
    data: { bag: await updateCart((c) => ({ ...c, email, address })), shipping: SHIPPING },
  }),
  setShipping: async (optionId: string): Promise<ActionResult<Bag>> => {
    if (!SHIPPING.some((s) => s.id === optionId)) return { ok: false, error: "Unknown delivery method" }
    return { ok: true, data: await updateCart((c) => ({ ...c, shipping: optionId })) }
  },
  setPayment: async (method: string, upi?: string): Promise<ActionResult<Bag>> => ({
    ok: true,
    data: await updateCart((c) => ({ ...c, payment: { method, upi } })),
  }),
  complete: async (): Promise<ActionResult<{ orderId: string }>> => {
    const cart = await getCart()
    const bag = toBag(cart)
    if (!bag.lines.length || !cart.address || !cart.email || !cart.shipping) return { ok: false, error: "Your checkout is incomplete" }
    const orders = await read<DemoOrder[]>(COOKIE.orders, [])
    const number = (orders[0]?.n ?? 0) + 1
    const order: DemoOrder = {
      id: `demo_order_${Date.now().toString(36)}`,
      n: number,
      d: new Date().toISOString(),
      e: cart.email,
      l: bag.lines.map((l) => [l.variantId, l.quantity, l.unitPrice]),
      a: cart.address,
      s: cart.shipping,
      p: cart.payment?.method ?? "upi",
      u: cart.payment?.upi,
      disc: bag.discount,
    }
    // Cookies are small: keep the five most recent demo orders.
    await write(COOKIE.orders, [order, ...orders].slice(0, 5))
    ;(await cookies()).delete(COOKIE.cart)
    return { ok: true, data: { orderId: order.id } }
  },
}

// Customer + orders -----------------------------------------------------

type DemoCustomer = Customer
type DemoOrder = {
  id: string
  n: number
  d: string
  e: string
  l: [string, number, number][]
  a: Fields
  s: string
  p: string
  u?: string
  disc: number
}

const PAYMENT_LABELS: Record<string, string> = { upi: "UPI", card: "Card", cod: "Cash on delivery" }

function expandOrder(o: DemoOrder): Order {
  const lines = o.l.flatMap(([v, quantity, unitPrice]) => {
    const hit = variant(v)
    return hit
      ? [{ id: v, handle: hit.product.handle, title: hit.product.title, size: hit.size.label, quantity, unitPrice, tone: hit.product.tones[0], silhouette: hit.product.silhouette, thumbnail: hit.product.images[0] }]
      : []
  })
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0)
  const ship = SHIPPING.find((s) => s.id === o.s) ?? SHIPPING[0]
  return {
    id: o.id,
    displayId: `MF-${String(o.n).padStart(5, "0")}`,
    createdAt: o.d,
    status: "placed",
    email: o.e,
    lines,
    shippingAddress: o.a,
    delivery: { id: ship.id, label: ship.label, price: ship.price },
    payment: { id: o.p, label: `${PAYMENT_LABELS[o.p] ?? o.p}${o.u ? ` (${o.u})` : ""}` },
    subtotal,
    discount: o.disc,
    shipping: ship.price,
    total: subtotal - o.disc + ship.price,
    currency: "inr",
  }
}

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? ""
  const first = local.split(/[._-]/)[0] ?? ""
  return first ? first[0].toUpperCase() + first.slice(1) : ""
}

export const demoCustomer = {
  session: async () => {
    const customer = await read<DemoCustomer | null>(COOKIE.customer, null)
    if (!customer) return null
    const addresses = await read<Address[]>(COOKIE.addresses, [])
    return { customer: { ...customer, emailVerified: true }, addresses: [...addresses].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault)) }
  },
  signIn: async (email: string, password: string, names?: { firstName: string; lastName: string; marketing: boolean }): Promise<ActionResult> => {
    if (password.length < 8) return { ok: false, error: "Use at least 8 characters" }
    const existing = await read<DemoCustomer | null>(COOKIE.customer, null)
    const same = existing?.email === email ? existing : null
    await write(COOKIE.customer, {
      id: `demo_cus_${email}`,
      email,
      firstName: names?.firstName || same?.firstName || nameFromEmail(email),
      lastName: names?.lastName || same?.lastName || "",
      phone: same?.phone ?? "",
      marketing: names?.marketing ?? same?.marketing ?? true,
      orderUpdatesSms: same?.orderUpdatesSms ?? false,
      emailVerified: true,
    } satisfies DemoCustomer)
    return { ok: true, data: undefined }
  },
  signOut: async () => {
    ;(await cookies()).delete(COOKIE.customer)
  },
  update: async (input: Partial<Customer>): Promise<ActionResult> => {
    const c = await read<DemoCustomer | null>(COOKIE.customer, null)
    if (!c) return { ok: false, error: "Please sign in again" }
    await write(COOKIE.customer, { ...c, ...input, email: c.email, id: c.id })
    return { ok: true, data: undefined }
  },
  saveAddress: async (address: Address, isNew: boolean): Promise<ActionResult<{ id: string }>> => {
    const list = await read<Address[]>(COOKIE.addresses, [])
    const id = isNew ? `demo_addr_${Date.now().toString(36)}` : address.id
    let next = isNew ? [...list, { ...address, id }] : list.map((a) => (a.id === id ? { ...address, id } : a))
    if (address.isDefault || next.length === 1) next = next.map((a) => ({ ...a, isDefault: a.id === id }))
    await write(COOKIE.addresses, next.slice(0, 6))
    return { ok: true, data: { id } }
  },
  deleteAddress: async (id: string): Promise<ActionResult> => {
    let next = (await read<Address[]>(COOKIE.addresses, [])).filter((a) => a.id !== id)
    if (next.length && !next.some((a) => a.isDefault)) next = next.map((a, i) => ({ ...a, isDefault: i === 0 }))
    await write(COOKIE.addresses, next)
    return { ok: true, data: undefined }
  },
  orders: async () => (await read<DemoOrder[]>(COOKIE.orders, [])).map(expandOrder),
  order: async (id: string) => {
    const o = (await read<DemoOrder[]>(COOKIE.orders, [])).find((x) => x.id === id)
    return o ? expandOrder(o) : null
  },
}

/**
 * Sample reviews for the demo store, so the reviews UI can be seen without a
 * backend. They are not real customer reviews, and the storefront labels them
 * "Sample review" with a note saying so. Picked deterministically per product.
 */
const SAMPLE_NAMES = ["Aarav M.", "Diya S.", "Kabir R.", "Meera P.", "Rohan K.", "Ananya G.", "Vikram T.", "Isha N.", "Arjun D.", "Sara F."]

const SAMPLE_TEXT: Record<"apparel" | "accessory", { rating: number; text: string }[]> = {
  apparel: [
    { rating: 5, text: "Fits true to size with that slightly boxy drop I wanted. Fabric feels heavier than most at this price." },
    { rating: 5, text: "Washed it three times now, cold and inside out. No shrinking and the print still looks sharp." },
    { rating: 4, text: "Great colour in person. I sized up for a looser fit and it sits well on the shoulders." },
    { rating: 4, text: "Soft from the first wear. Took a star off because delivery took a day longer than shown." },
    { rating: 3, text: "Nice quality but runs a little long for me at 5'6\". Size down if you're between sizes." },
    { rating: 5, text: "Got compliments the first day I wore it. Stitching is neat and the collar holds its shape." },
  ],
  accessory: [
    { rating: 5, text: "Solid build, strap feels sturdy and the hardware has not loosened after weeks of daily use." },
    { rating: 4, text: "Looks exactly like the photos. Slightly smaller than I expected, so check the dimensions." },
    { rating: 5, text: "Goes with everything I own. Material has held up well through monsoon commutes." },
    { rating: 4, text: "Good value for the price. Colour is a touch darker in person, which I actually prefer." },
  ],
}

function seed(text: string) {
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function demoReviews(productId: string): { stats: ReviewStats; reviews: Review[] } {
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) return { stats: { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }, reviews: [] }
  const pool = SAMPLE_TEXT[product.silhouette === "bag" || product.silhouette === "cap" ? "accessory" : "apparel"]
  const h = seed(product.handle)
  const count = 2 + (h % 3)
  const base = Date.UTC(2026, 9, 28)
  const reviews: Review[] = Array.from({ length: count }, (_, i) => {
    const pick = pool[(h + i * 7) % pool.length]
    return {
      id: `demo_rev_${product.handle}_${i}`,
      name: SAMPLE_NAMES[(h + i * 3) % SAMPLE_NAMES.length],
      rating: pick.rating,
      content: pick.text,
      createdAt: new Date(base - (((h >>> (i + 2)) % 40) + i * 9) * 86400000).toISOString(),
      images: [],
      sample: true,
    }
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const distribution: ReviewStats["distribution"] = [0, 0, 0, 0, 0]
  for (const r of reviews) distribution[r.rating - 1]++
  const average = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
  return { stats: { average, count: reviews.length, distribution }, reviews }
}

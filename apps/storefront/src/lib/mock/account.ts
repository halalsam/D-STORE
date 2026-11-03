/**
 * MOCK ACCOUNT DATA
 * Stands in for the Medusa customer, addresses and orders
 * (sdk.store.customer.retrieve, .listAddress, sdk.store.order.list).
 */
import { getProduct, type Product } from "./catalog"

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
  firstName: string
  lastName: string
  email: string
  phone: string
  marketing: boolean
  orderUpdatesSms: boolean
}

export type OrderStatus = "placed" | "packed" | "shipped" | "delivered" | "cancelled"

export type OrderLine = {
  handle: string
  title: string
  size: string
  quantity: number
  unitPrice: number
  tone: readonly [string, string]
  silhouette: Product["silhouette"]
}

export type Order = {
  id: string
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

export const demoCustomer: Customer = {
  firstName: "Aarav",
  lastName: "Mehta",
  email: "aarav.mehta@example.com",
  phone: "+91 98765 43210",
  marketing: true,
  orderUpdatesSms: false,
}

export const demoAddresses: Address[] = [
  {
    id: "addr_home",
    label: "Home",
    firstName: "Aarav",
    lastName: "Mehta",
    phone: "+91 98765 43210",
    line1: "14, Palm Grove Apartments",
    line2: "Carter Road, Bandra West",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400050",
    country: "India",
    isDefault: true,
  },
  {
    id: "addr_work",
    label: "Studio",
    firstName: "Aarav",
    lastName: "Mehta",
    phone: "+91 98765 43210",
    line1: "3rd Floor, Indiranagar Works",
    line2: "100 Feet Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560038",
    country: "India",
  },
]

function line(handle: string, size: string, quantity = 1): OrderLine {
  const p = getProduct(handle)!
  return { handle, title: p.title, size, quantity, unitPrice: p.price, tone: p.tones[0], silhouette: p.silhouette }
}

function order(id: string, createdAt: string, status: OrderStatus, lines: OrderLine[], tracking?: string): Order {
  const subtotal = lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0)
  const a = demoAddresses[0]
  const shippingAddress = {
    firstName: a.firstName, lastName: a.lastName, phone: a.phone, line1: a.line1, line2: a.line2,
    city: a.city, state: a.state, postalCode: a.postalCode, country: a.country,
  }
  return {
    id,
    createdAt,
    status,
    email: demoCustomer.email,
    lines,
    shippingAddress,
    delivery: { id: "standard", label: "Standard delivery", price: 0 },
    payment: { id: "upi", label: "UPI" },
    subtotal,
    discount: 0,
    shipping: 0,
    total: subtotal,
    currency: "inr",
    tracking,
  }
}

export const demoOrders: Order[] = [
  order("DS-10482", "2026-10-28T10:24:00.000Z", "shipped", [line("storm-cell-hoodie", "L"), line("tidal-static-tee", "M")], "BLDT 8842 1190"),
  order("DS-10311", "2026-09-14T16:05:00.000Z", "delivered", [line("harbour-satin-shirt", "M"), line("club-six-panel-cap", "One size")]),
  order("DS-10077", "2026-07-02T08:40:00.000Z", "delivered", [line("deckhand-tee-navy", "M", 2), line("deckhand-tee-bone", "L")]),
]

export const orderStatusLabel: Record<OrderStatus, string> = {
  placed: "Order placed",
  packed: "Packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]

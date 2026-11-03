/**
 * MOCK CATALOG
 * Placeholder data so the UI can be built before the Medusa API is wired.
 * Replace with calls in src/lib/data/* (store.product.list, store.collection.list...).
 */

export type Tone = readonly [string, string]
export type Silhouette = "tee" | "shirt" | "hoodie" | "bag" | "cap"

export type Size = { label: string; available: boolean }

export type Product = {
  id: string
  handle: string
  title: string
  price: number
  compareAt?: number
  currency: string
  collection: string
  category: string
  type: "T-shirt" | "Shirt" | "Hoodie" | "Bottoms" | "Bag" | "Cap"
  color: ColorFamily
  silhouette: Silhouette
  tones: readonly Tone[]
  sizes: Size[]
  badge?: string
  description: string
  washcare: string[]
}

export type ColorFamily = "Blues" | "Browns" | "Greens" | "Neutrals" | "Purples" | "Reds"

export const colorFamilies: { name: ColorFamily; swatches: string[] }[] = [
  { name: "Blues", swatches: ["#7EA6E0", "#4F6FD1", "#2F4BB0", "#1E2F7A"] },
  { name: "Browns", swatches: ["#D9C2AE", "#A9846A", "#7A563F", "#4A3326"] },
  { name: "Greens", swatches: ["#9FD8B0", "#4FB878", "#2E8A55", "#1F5E3B"] },
  { name: "Neutrals", swatches: ["#F4F1EC", "#B8B5B0", "#6E6C69", "#1E1E1E"] },
  { name: "Purples", swatches: ["#E3A7E8", "#C66AD6", "#9A47C4", "#6B2FA0"] },
  { name: "Reds", swatches: ["#F2B04B", "#E8713C", "#C9412F", "#8E1F1F"] },
]

const apparel = ["XXS", "XS", "S", "M", "L", "XL", "XXL"]
const sizes = (soldOut: string[] = []): Size[] =>
  apparel.map((label) => ({ label, available: !soldOut.includes(label) }))
const oneSize = (available = true): Size[] => [{ label: "One size", available }]

const tee = {
  description:
    "Heavyweight 240 GSM cotton jersey, garment washed for a broken-in hand. Boxy, dropped shoulder fit with a ribbed collar and a high-density back print.",
  washcare: ["Machine wash cold, inside out", "Do not tumble dry", "Iron on reverse, avoid the print", "Do not dry clean"],
}
const shirt = {
  description:
    "Breathable linen blend with an all-over print, camp collar and mother of pearl buttons. Relaxed through the body, cut slightly long.",
  washcare: ["Hand wash or gentle cycle, cold", "Hang dry in shade", "Warm iron", "Do not bleach"],
}

export const products: Product[] = [
  { id: "p1", handle: "tidal-static-tee", title: "Tidal Static Tee", price: 5500, currency: "inr", collection: "new-arrivals", category: "t-shirts", type: "T-shirt", color: "Blues", silhouette: "tee", badge: "New",
    tones: [["#1F2B39", "#3E6FA8"], ["#273647", "#567C8D"], ["#1F2B39", "#7E9BB2"]], sizes: sizes(), ...tee },
  { id: "p2", handle: "ember-script-tee", title: "Ember Script Tee", price: 5500, currency: "inr", collection: "new-arrivals", category: "t-shirts", type: "T-shirt", color: "Reds", silhouette: "tee",
    tones: [["#1E1E1E", "#8E1F1F"], ["#2A1A18", "#C9412F"], ["#1E1E1E", "#4A3326"]], sizes: sizes(["XXL"]), ...tee },
  { id: "p3", handle: "moth-signal-tee", title: "Moth Signal Tee", price: 5000, currency: "inr", collection: "new-arrivals", category: "t-shirts", type: "T-shirt", color: "Reds", silhouette: "tee",
    tones: [["#7A1F2B", "#C9412F"], ["#5A1620", "#E8713C"], ["#7A1F2B", "#1E1E1E"]], sizes: sizes(), ...tee },
  { id: "p4", handle: "storm-cell-hoodie", title: "Storm Cell Hoodie", price: 14000, currency: "inr", collection: "new-arrivals", category: "hoodies", type: "Hoodie", color: "Blues", silhouette: "hoodie", badge: "New",
    tones: [["#141B24", "#2F4BB0"], ["#1F2B39", "#4F6FD1"], ["#141B24", "#567C8D"]], sizes: sizes(["XXS"]), ...tee },
  { id: "p5", handle: "shoal-linen-shirt-rose", title: "Shoal Linen Shirt, Rose", price: 7200, currency: "inr", collection: "coastline", category: "shirts", type: "Shirt", color: "Purples", silhouette: "shirt",
    tones: [["#8A5A7A", "#E3A7C8"], ["#6B3F5E", "#C66AD6"], ["#E3A7C8", "#F5EFEB"]], sizes: sizes(["XXL"]), ...shirt },
  { id: "p6", handle: "shoal-linen-shirt-sea", title: "Shoal Linen Shirt, Sea", price: 7200, currency: "inr", collection: "coastline", category: "shirts", type: "Shirt", color: "Greens", silhouette: "shirt",
    tones: [["#567C8D", "#C8D9E6"], ["#38505E", "#9FD8B0"], ["#90A9B5", "#F2F6F9"]], sizes: sizes(), ...shirt },
  { id: "p7", handle: "harbour-satin-shirt", title: "Harbour Satin Shirt", price: 7495, currency: "inr", collection: "coastline", category: "shirts", type: "Shirt", color: "Blues", silhouette: "shirt",
    tones: [["#2F4BB0", "#7EA6E0"], ["#1E2F7A", "#F2B04B"], ["#4F6FD1", "#C8D9E6"]], sizes: sizes(["XS", "M"]), compareAt: 8995, ...shirt },
  { id: "p8", handle: "marina-sunset-shirt", title: "Marina Sunset Shirt", price: 7495, currency: "inr", collection: "coastline", category: "shirts", type: "Shirt", color: "Reds", silhouette: "shirt",
    tones: [["#C9412F", "#F2B04B"], ["#8E1F1F", "#E8713C"], ["#2F4156", "#E8713C"]], sizes: sizes(), ...shirt },
  { id: "p9", handle: "regatta-stripe-shirt", title: "Regatta Stripe Shirt", price: 6800, currency: "inr", collection: "coastline", category: "shirts", type: "Shirt", color: "Neutrals", silhouette: "shirt",
    tones: [["#B8B5B0", "#F4F1EC"], ["#6E6C69", "#DED4CC"], ["#F4F1EC", "#C8D9E6"]], sizes: sizes(["XXS", "XXL"]), ...shirt },
  { id: "p10", handle: "deckhand-tee-sand", title: "Deckhand Tee, Sand", price: 3900, currency: "inr", collection: "essentials", category: "t-shirts", type: "T-shirt", color: "Browns", silhouette: "tee",
    tones: [["#A9846A", "#D9C2AE"], ["#7A563F", "#ECE4DE"], ["#D9C2AE", "#F5EFEB"]], sizes: sizes(), ...tee },
  { id: "p11", handle: "deckhand-tee-navy", title: "Deckhand Tee, Navy", price: 3900, currency: "inr", collection: "essentials", category: "t-shirts", type: "T-shirt", color: "Blues", silhouette: "tee",
    tones: [["#1F2B39", "#2F4156"], ["#273647", "#445568"], ["#2F4156", "#5A697B"]], sizes: sizes(), ...tee },
  { id: "p12", handle: "deckhand-tee-bone", title: "Deckhand Tee, Bone", price: 3900, currency: "inr", collection: "essentials", category: "t-shirts", type: "T-shirt", color: "Neutrals", silhouette: "tee",
    tones: [["#DED4CC", "#FBF9F7"], ["#C7BAB0", "#F5EFEB"], ["#ECE4DE", "#FFFFFF"]], sizes: sizes(["M"]), ...tee },
  { id: "p13", handle: "crest-card-case", title: "Crest Card Case", price: 7000, currency: "inr", collection: "accessories", category: "bags", type: "Bag", color: "Neutrals", silhouette: "bag",
    tones: [["#141B24", "#2F4156"], ["#1F2B39", "#567C8D"], ["#273647", "#445568"]], sizes: oneSize(), ...tee },
  { id: "p14", handle: "crest-duffle-leather", title: "Crest Duffle, Leather", price: 25000, currency: "inr", collection: "accessories", category: "bags", type: "Bag", color: "Neutrals", silhouette: "bag",
    tones: [["#ECE4DE", "#FFFFFF"], ["#DED4CC", "#FBF9F7"], ["#C7BAB0", "#F5EFEB"]], sizes: oneSize(), ...tee },
  { id: "p15", handle: "crest-carryall-leather", title: "Crest Carryall, Leather", price: 35000, currency: "inr", collection: "accessories", category: "bags", type: "Bag", color: "Browns", silhouette: "bag",
    tones: [["#4A3326", "#A9846A"], ["#33302F", "#7A563F"], ["#4A3326", "#D9C2AE"]], sizes: oneSize(false), ...tee },
  { id: "p16", handle: "crest-carryall-jacquard", title: "Crest Carryall, Jacquard", price: 30000, currency: "inr", collection: "accessories", category: "bags", type: "Bag", color: "Neutrals", silhouette: "bag",
    tones: [["#33302F", "#6E6C69"], ["#1E1E1E", "#B8B5B0"], ["#33302F", "#857A73"]], sizes: oneSize(false), ...tee },
  { id: "p17", handle: "club-six-panel-cap", title: "Club Six Panel Cap", price: 2900, currency: "inr", collection: "accessories", category: "caps", type: "Cap", color: "Greens", silhouette: "cap",
    tones: [["#1F5E3B", "#4FB878"], ["#2E8A55", "#9FD8B0"], ["#1F5E3B", "#F5EFEB"]], sizes: oneSize(), ...tee },
  { id: "p18", handle: "orchid-boxy-tee", title: "Orchid Boxy Tee", price: 4500, currency: "inr", collection: "coastline", category: "t-shirts", type: "T-shirt", color: "Purples", silhouette: "tee",
    tones: [["#6B2FA0", "#E3A7E8"], ["#9A47C4", "#F5EFEB"], ["#6B2FA0", "#1F2B39"]], sizes: sizes(["XXS", "XS"]), ...tee },
]

export type Collection = { handle: string; title: string; blurb: string; tone: Tone }

export const collections: Collection[] = [
  { handle: "new-arrivals", title: "New Arrivals", blurb: "The latest drop, fresh off the press.", tone: ["#1F2B39", "#567C8D"] },
  { handle: "coastline", title: "Coastline Collection", blurb: "Linen, satin and sun-faded prints for long days by the water.", tone: ["#C9412F", "#E3A7C8"] },
  { handle: "essentials", title: "Essentials", blurb: "Everyday heavyweight basics in the core palette.", tone: ["#A9846A", "#ECE4DE"] },
  { handle: "accessories", title: "Bags and Accessories", blurb: "Leather, jacquard and hardware built to be carried daily.", tone: ["#141B24", "#445568"] },
]

export const menu = {
  collections: [
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

export const productTypes = ["T-shirt", "Shirt", "Hoodie", "Bag", "Cap"] as const

export function getCollection(handle: string) {
  return collections.find((c) => c.handle === handle)
}
export function getProductsByCollection(handle: string) {
  return products.filter((p) => p.collection === handle)
}
export function getProduct(handle: string) {
  return products.find((p) => p.handle === handle)
}
export function isSoldOut(p: Product) {
  return p.sizes.every((s) => !s.available)
}

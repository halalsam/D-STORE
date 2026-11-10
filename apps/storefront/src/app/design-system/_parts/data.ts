export const baseSwatches = [
  { name: "Navy", hex: "#2F4156", token: "navy-800", ink: "#FFFFFF", role: "Ink and filled actions" },
  { name: "Teal", hex: "#567C8D", token: "teal-500", ink: "#F5EFEB", role: "Accent, focus, active" },
  { name: "Sky Blue", hex: "#C8D9E6", token: "sky-200", ink: "#2F4156", role: "Soft highlight, selection" },
  { name: "Beige", hex: "#F5EFEB", token: "beige-100", ink: "#2F4156", role: "Page canvas" },
  { name: "White", hex: "#FFFFFF", token: "white", ink: "#567C8D", role: "Surfaces" },
] as const

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export const ramps = {
  navy: ["#EFF1F2", "#D5D9DE", "#BBC1C9", "#A2ABB5", "#8994A1", "#717E8E", "#5A697B", "#445568", "#2F4156", "#273647", "#1F2B39"],
  teal: ["#ECF0F2", "#CDD8DD", "#AEC0C9", "#90A9B5", "#7392A1", "#567C8D", "#4C6D7D", "#425E6D", "#38505E", "#2F424F", "#263540"],
  sky: ["#F2F6F9", "#DDE8F0", "#C8D9E6", "#B5CADB", "#A3BBCD", "#7E9BB2", "#607E96", "#4B6479", "#3A4E60", "#2C3B49", "#1F2B36"],
  beige: ["#FBF9F7", "#F5EFEB", "#ECE4DE", "#DED4CC", "#C7BAB0", "#A89A90", "#857A73", "#655D59", "#4A4543", "#33302F", "#221F1E"],
} as const

export const anchors: Record<keyof typeof ramps, number> = {
  navy: 800,
  teal: 500,
  sky: 200,
  beige: 100,
}

export { steps }

export const semantic = [
  { group: "Surface", token: "canvas", maps: "beige-100", hex: "#F5EFEB", use: "Rounded page sheet behind content" },
  { group: "Surface", token: "surface", maps: "white", hex: "#FFFFFF", use: "Header, cards, inset panels" },
  { group: "Surface", token: "surface-muted", maps: "beige-200", hex: "#ECE4DE", use: "Chips, inputs, menu pill" },
  { group: "Surface", token: "surface-strong", maps: "beige-300", hex: "#DED4CC", use: "Pressed chip, disabled fill" },
  { group: "Surface", token: "surface-inverse", maps: "navy-800", hex: "#2F4156", use: "Filled CTA, selected size" },
  { group: "Surface", token: "surface-tint", maps: "sky-100", hex: "#DDE8F0", use: "Brand highlight blocks" },
  { group: "Ink", token: "ink", maps: "navy-800", hex: "#2F4156", use: "Primary text and icons" },
  { group: "Ink", token: "ink-muted", maps: "navy-600", hex: "#5A697B", use: "Prices, secondary text" },
  { group: "Ink", token: "ink-subtle", maps: "navy-400", hex: "#8994A1", use: "Placeholders, decoration only" },
  { group: "Accent", token: "accent", maps: "teal-500", hex: "#567C8D", use: "Focus ring, active tab line" },
  { group: "Accent", token: "accent-ink", maps: "teal-700", hex: "#425E6D", use: "Links and accent text" },
  { group: "Accent", token: "accent-soft", maps: "sky-200", hex: "#C8D9E6", use: "Selected chip, selection" },
  { group: "Feedback", token: "success", maps: "custom", hex: "#3F7A5E", use: "In stock, order placed" },
  { group: "Feedback", token: "warning", maps: "custom", hex: "#A8772A", use: "Low stock, pre-order" },
  { group: "Feedback", token: "danger", maps: "custom", hex: "#B0463C", use: "Errors, sale price" },
] as const

export const typeRoles = [
  { cls: "type-display-2xl", name: "Display 2XL", spec: "Amulya Bold, 56 to 136, lh 0.9, -3.5%", sample: "Drop 04" },
  { cls: "type-display-xl", name: "Display XL", spec: "Amulya Bold, 44 to 92, lh 0.94, -3%", sample: "Yacht club" },
  { cls: "type-display-lg", name: "Display LG", spec: "Amulya Bold, 36 to 68, lh 1, -2.5%", sample: "Worn loud" },
  { cls: "type-heading-xl", name: "Heading XL", spec: "Amulya Bold, 36, lh 1.05", sample: "Bags and accessories" },
  { cls: "type-heading-lg", name: "Heading LG", spec: "Amulya Bold, 28, lh 1.1", sample: "Your bag" },
  { cls: "type-heading-md", name: "Heading MD", spec: "Amulya Bold, 22, lh 1.2", sample: "Pink Feeding Frenzy Shirt" },
  { cls: "type-heading-sm", name: "Heading SM", spec: "Amulya Bold, 18, lh 1.25", sample: "Shipping and returns" },
  { cls: "type-title", name: "Title", spec: "Amulya Bold, 16, lh 1.3", sample: "Latest drop" },
  { cls: "type-body-lg", name: "Body LG", spec: "Synonym Regular, 17, lh 1.55", sample: "Linen blend, relaxed fit, mother of pearl buttons." },
  { cls: "type-body", name: "Body", spec: "Synonym Regular, 15, lh 1.55", sample: "Packed within 24 hours. Dispatches next day." },
  { cls: "type-body-sm", name: "Body SM", spec: "Synonym Regular, 13, lh 1.45", sample: "Marina Bay Shirt" },
  { cls: "type-caption", name: "Caption", spec: "Synonym Regular, 12, lh 1.35", sample: "By continuing, you agree to our terms" },
  { cls: "type-label", name: "Label", spec: "Synonym Medium, 13, +6%, uppercase", sample: "Add to bag" },
  { cls: "type-overline", name: "Overline", spec: "Synonym Medium, 11, +10%, uppercase", sample: "Filter / 25 products" },
] as const

export const radii = [
  { token: "xs", px: 6, use: "Tags, badges" },
  { token: "sm", px: 10, use: "Icon buttons" },
  { token: "md", px: 14, use: "Thumbnails, inputs" },
  { token: "lg / card", px: 18, use: "Product media" },
  { token: "xl", px: 24, use: "Info card, drawers" },
  { token: "2xl / panel", px: 32, use: "Inset panels, menu" },
  { token: "3xl / sheet", px: 44, use: "Page sheet" },
  { token: "pill", px: 999, use: "Buttons, chips" },
] as const

export const shadows = [
  { token: "xs", use: "Hairline lift" },
  { token: "sm", use: "Floating chips" },
  { token: "md", use: "Popovers, menus" },
  { token: "lg", use: "Drawers, sheets" },
  { token: "glass", use: "Material bars" },
] as const

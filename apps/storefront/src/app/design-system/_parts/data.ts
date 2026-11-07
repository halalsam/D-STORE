export const baseSwatches = [
  { name: "Night", hex: "#0A0E16", token: "night-900", ink: "#E8ECF2", role: "Page canvas", hairline: true },
  { name: "Surface", hex: "#121722", token: "night-800", ink: "#A4ADBC", role: "Header, cards, panels", hairline: true },
  { name: "Frost", hex: "#E8ECF2", token: "night-50", ink: "#0A0E16", role: "Ink and filled actions", hairline: false },
  { name: "Sky", hex: "#7AB3D7", token: "sky-400", ink: "#040C1D", role: "Accent, focus, active", hairline: false },
  { name: "Navy", hex: "#0A1730", token: "navy-800", ink: "#93C3E2", role: "Brand navy, logo", hairline: true },
] as const

const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

export const ramps = {
  night: ["#E8ECF2", "#C9D0DB", "#A4ADBC", "#7F899A", "#5B6577", "#3A4354", "#262D3C", "#1B212E", "#121722", "#0A0E16", "#06090F"],
  navy: ["#F1F2F4", "#DADDE2", "#BCC1C9", "#9DA3AF", "#7E8796", "#616B7D", "#475267", "#26334A", "#0A1730", "#040C1D", "#02050F"],
  sky: ["#F7FAFD", "#ECF4FA", "#DAEAF4", "#93C3E2", "#7AB3D7", "#5E8DAF", "#496F90", "#385876", "#1C3348", "#14202F", "#0E1724"],
  teal: ["#F3F6F8", "#E0E7ED", "#C2CFDB", "#A1B5C7", "#7A96AF", "#496F90", "#3D5E7E", "#324F6E", "#27415E", "#1D334F", "#152742"],
} as const

export const anchors: Record<keyof typeof ramps, number> = {
  night: 900,
  navy: 800,
  sky: 400,
  teal: 500,
}

export { steps }

const CANVAS = "#0A0E16"

export const semantic = [
  { group: "Surface", token: "canvas", maps: "night-900", hex: "#0A0E16", on: CANVAS, use: "Rounded page sheet behind content" },
  { group: "Surface", token: "surface", maps: "night-800", hex: "#121722", on: CANVAS, use: "Header, cards, inset panels" },
  { group: "Surface", token: "surface-muted", maps: "night-700", hex: "#1B212E", on: CANVAS, use: "Chips, inputs, menu pill" },
  { group: "Surface", token: "surface-strong", maps: "night-600", hex: "#262D3C", on: CANVAS, use: "Pressed chip, disabled fill" },
  { group: "Surface", token: "surface-inverse", maps: "night-50", hex: "#E8ECF2", on: CANVAS, use: "Filled CTA, selected size" },
  { group: "Surface", token: "surface-tint", maps: "sky-900", hex: "#14202F", on: CANVAS, use: "Brand highlight blocks" },
  { group: "Ink", token: "ink", maps: "night-50", hex: "#E8ECF2", on: CANVAS, use: "Primary text and icons" },
  { group: "Ink", token: "ink-muted", maps: "night-200", hex: "#A4ADBC", on: CANVAS, use: "Prices, secondary text" },
  { group: "Ink", token: "ink-subtle", maps: "night-300", hex: "#7F899A", on: CANVAS, use: "Placeholders, meta" },
  { group: "Ink", token: "ink-inverse", maps: "night-900", hex: "#0A0E16", on: "#E8ECF2", use: "Text on surface-inverse" },
  { group: "Ink", token: "ink-on-accent", maps: "navy-900", hex: "#040C1D", on: "#7AB3D7", use: "Text on accent fills" },
  { group: "Accent", token: "accent", maps: "sky-400", hex: "#7AB3D7", on: CANVAS, use: "Focus ring, active tab line" },
  { group: "Accent", token: "accent-ink", maps: "sky-300", hex: "#93C3E2", on: CANVAS, use: "Links and accent text" },
  { group: "Accent", token: "accent-soft", maps: "sky-800", hex: "#1C3348", on: CANVAS, use: "Selected chip, selection" },
  { group: "Feedback", token: "success", maps: "custom", hex: "#5DBA8A", on: CANVAS, use: "In stock, order placed" },
  { group: "Feedback", token: "warning", maps: "custom", hex: "#E0A852", on: CANVAS, use: "Low stock, pre-order" },
  { group: "Feedback", token: "danger", maps: "custom", hex: "#F0766A", on: CANVAS, use: "Errors, sale price" },
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

import type { SizeChart } from "./types"

/** Fallback when a product carries no chart of its own. Inches. */
export const genericChart: SizeChart = {
  columns: ["Chest", "Length", "Shoulder"],
  rows: [
    ["XXS", "38", "26", "21"],
    ["XS", "40", "27", "21.5"],
    ["S", "42", "28", "22"],
    ["M", "44", "29", "22.5"],
    ["L", "46", "30", "23"],
    ["XL", "48", "31", "23.5"],
    ["XXL", "50", "32", "24"],
  ],
}

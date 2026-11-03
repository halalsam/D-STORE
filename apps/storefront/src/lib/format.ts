const formatters = new Map<string, Intl.NumberFormat>()

/**
 * Format a price for display. Medusa returns amounts in major units
 * (e.g. 5500 for Rs. 5,500), so no division happens here.
 */
export function formatPrice(amount: number, currencyCode = "inr", locale = "en-IN") {
  const key = `${locale}:${currencyCode}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 0,
    })
    formatters.set(key, f)
  }
  return f.format(amount)
}

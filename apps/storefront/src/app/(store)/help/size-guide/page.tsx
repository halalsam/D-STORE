import type { Metadata } from "next"
import { InfoPage, InfoSection } from "@/components/store/info-page"
import { SizeTable } from "@/components/store/size-table"
import { listProducts } from "@/lib/data/catalog"
import { genericChart } from "@/lib/size-chart"
import type { SizeChart } from "@/lib/types"

export const metadata: Metadata = { title: "Size guide", description: "Garment measurements for every fit, in inches." }

const typeTitles: Record<string, string> = {
  "T-shirt": "T-shirts",
  Polo: "Polos",
  Shirt: "Shirts",
  Hoodie: "Hoodies",
  Sweater: "Knitwear",
  Jacket: "Jackets",
  Joggers: "Joggers",
  Shorts: "Shorts",
}

export default async function SizeGuidePage() {
  const products = await listProducts()
  // One chart per product type: the most common chart for that type.
  const byType = new Map<string, Map<string, { chart: SizeChart; n: number }>>()
  for (const p of products) {
    if (!p.sizeChart) continue
    const key = JSON.stringify(p.sizeChart)
    const charts = byType.get(p.type) ?? new Map()
    charts.set(key, { chart: p.sizeChart, n: (charts.get(key)?.n ?? 0) + 1 })
    byType.set(p.type, charts)
  }
  const charts = Object.keys(typeTitles).flatMap((type) => {
    const options = byType.get(type)
    if (!options) return []
    const best = [...options.values()].sort((a, b) => b.n - a.n)[0]
    return [{ type, chart: best.chart }]
  })

  return (
    <InfoPage
      nav="help"
      current="/help/size-guide"
      title="Size guide"
      intro="Measurements are taken from the garment laid flat, in inches. Every product page also has the chart for that exact piece."
    >
      <InfoSection title="How to choose">
        <p>
          Measure a piece you already like the fit of and compare it with the chart. Our tees and shirts are cut oversized, so pick your usual size for a relaxed fit or
          size down for a closer one.
        </p>
      </InfoSection>
      {charts.length > 0 ? (
        charts.map(({ type, chart }) => (
          <InfoSection key={type} title={typeTitles[type]}>
            <SizeTable chart={chart} className="max-w-none bg-canvas" />
          </InfoSection>
        ))
      ) : (
        <InfoSection title="Tops">
          <SizeTable chart={genericChart} className="bg-canvas" />
        </InfoSection>
      )}
      <InfoSection title="Caps">
        <p>Caps have an adjustable band and fit a head circumference of 54 to 58 cm.</p>
      </InfoSection>
    </InfoPage>
  )
}

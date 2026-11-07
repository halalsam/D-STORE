import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronDown } from "@/components/ui/icons"
import { genericChart } from "@/lib/size-chart"
import type { Product } from "@/lib/types"
import { ProductMedia } from "./product-media"
import { SizeTable } from "./size-table"

/** Native <details>: works before hydration and with no JavaScript. */
function Item({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group/item border-t border-line first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 type-body font-medium text-ink [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="size-4 shrink-0 text-ink-muted transition-transform duration-(--duration-spring) ease-spring group-open/item:rotate-180" strokeWidth={1.8} />
      </summary>
      <div className="pb-5 type-body-sm text-ink-muted">{children}</div>
    </details>
  )
}

function Specs({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-4 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-subtle">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

const sizeRange = (p: Product) => (p.sizes.length > 1 ? `${p.sizes[0].label} to ${p.sizes.at(-1)!.label}` : "One size")

/** Expandable product facts under the buy box. Each fact lives in one place only. */
export function ProductAccordion({ product, reviews, reviewCount }: { product: Product; reviews: ReactNode; reviewCount: number }) {
  if (product.giftCard) {
    return (
      <section className="shrink-0 rounded-xl bg-surface px-5 ring-1 ring-line ring-inset">
        <Item title="Description" open>
          <p>{product.description}</p>
        </Item>
        <Item title="How it works">
          <ul className="grid list-disc gap-1.5 pl-4">
            <li>The code arrives by email within a few minutes of paying.</li>
            <li>Enter it at checkout, or add it to your account balance.</li>
            <li>Pay by UPI, card or PhonePe. Not available with cash on delivery.</li>
          </ul>
        </Item>
      </section>
    )
  }
  return (
    <section className="shrink-0 rounded-xl bg-surface px-5 ring-1 ring-line ring-inset">
      <Item title="Description" open>
        <p>{product.description}</p>
        <Specs
          rows={[
            ["Type", product.type || "Apparel"],
            ...(product.collectionTitle
              ? [["Collection", <Link key="c" href={`/collections/${product.collection}`} className="underline underline-offset-2 hover:text-accent-ink">{product.collectionTitle}</Link>] as [string, ReactNode]]
              : []),
            ["Sizes", sizeRange(product)],
          ]}
        />
      </Item>
      {product.washcare.length > 0 && (
        <Item title="Fabric and care">
          <ul className="grid list-disc gap-1.5 pl-4">
            {product.washcare.map((w) => <li key={w}>{w}</li>)}
          </ul>
        </Item>
      )}
      <Item title="Delivery and returns">
        <Specs
          rows={[
            ["Standard", "Free, 3 to 5 business days"],
            ["Express", "₹250, 1 to 2 business days in metro cities"],
            ["Store pickup", "Free at MotionFit Bandra, ready in 24 hours"],
            ["Returns", "Within 14 days of delivery, unworn with tags. We pick it up from your address."],
          ]}
        />
        <p className="mt-4">
          <Link href="/help/shipping" className="underline underline-offset-2 hover:text-accent-ink">Shipping</Link>
          {" · "}
          <Link href="/help/returns" className="underline underline-offset-2 hover:text-accent-ink">Returns</Link>
        </p>
      </Item>
      <Item title={reviewCount ? `Reviews (${reviewCount})` : "Reviews"}>{reviews}</Item>
    </section>
  )
}

/**
 * Size and fit, beside a photo the gallery above does not show. Skipped for
 * products without sizes (bags, caps), whose chart is null.
 */
export function SizeFitSection({ product, view }: { product: Product; view?: { tone: Product["tones"][number]; src?: string } }) {
  if (product.sizeChart === null || product.giftCard || product.sizes.length < 2) return null
  const chart = product.sizeChart ?? genericChart
  return (
    <section id="size-fit" className="page-x scroll-mt-24 pt-section">
      <div className={view ? "grid gap-tile lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]" : undefined}>
        {view && (
          <div className="group relative hidden min-h-[30rem] overflow-hidden rounded-card bg-surface-muted lg:block">
            <ProductMedia tone={view.tone} src={view.src} silhouette={product.silhouette} alt={`${product.title}, worn`} className="media-zoom" sizes="40vw" />
          </div>
        )}
        <div className="panel grid content-start gap-6">
          <div>
            <h2 className="type-heading-md">Size and fit</h2>
            <p className="mt-2 max-w-[56ch] type-body-sm text-ink-muted">
              Garment measurements in inches, taken flat.{product.sizeChart ? "" : " Boxy fit: size down for a closer silhouette."}
            </p>
          </div>
          <SizeTable chart={chart} className="ring-1 ring-line ring-inset" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Chest", "Measure across the chest, armpit to armpit, then double it."],
              ["Shoulder", "Seam to seam across the back, at the widest point."],
              ["Length", "From the highest point of the shoulder down to the hem."],
            ]
              .filter(([k]) => chart.columns.includes(k))
              .map(([k, v]) => (
                <div key={k}>
                  <p className="type-body-sm font-medium text-ink">{k}</p>
                  <p className="mt-1 type-caption text-ink-muted">{v}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}

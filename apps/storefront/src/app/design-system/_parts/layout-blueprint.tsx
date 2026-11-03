import { Bookmark, Plus, ZoomIn } from "@/components/ui/icons"
import { DsHeader } from "./ds-header"

const tones = [
  "bg-[linear-gradient(160deg,var(--color-sky-300),var(--color-teal-600))]",
  "bg-[linear-gradient(160deg,var(--color-navy-700),var(--color-navy-950))]",
  "bg-[linear-gradient(160deg,var(--color-beige-300),var(--color-beige-500))]",
  "bg-[linear-gradient(160deg,var(--color-teal-300),var(--color-navy-800))]",
]

function CardSketch({ tone, soldOut = false, name, price }: { tone: string; soldOut?: boolean; name: string; price: string }) {
  return (
    <article className={"group pressable-soft " + (soldOut ? "opacity-45" : "")}>
      <div className="relative aspect-card overflow-hidden rounded-card">
        <div className={`absolute inset-0 media-zoom ${tone}`} />
        {soldOut && <span className="absolute top-3 left-3 type-caption text-ink-on-media">Sold out</span>}
        <Bookmark className="absolute top-3 right-3 size-5 fill-current/70 text-ink-on-media" strokeWidth={0} />
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          <span className="size-1.5 rounded-pill bg-white" />
          <span className="size-1.5 rounded-pill bg-white/60" />
          <span className="size-1 self-center rounded-pill bg-white/60" />
        </div>
      </div>
      <div className="flex items-start justify-between gap-3 px-3 pt-2.5">
        <div className="min-w-0">
          <p className="truncate type-body-sm font-medium">{name}</p>
          <p className="type-body-sm type-price text-ink-muted">{price}</p>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-pill text-ink">
          <Plus className="size-5" strokeWidth={1.4} />
        </span>
      </div>
    </article>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none relative z-10 inline-block whitespace-nowrap rounded-xs bg-accent px-1.5 py-0.5 font-mono text-[0.625rem] text-white shadow-sm">
      {children}
    </span>
  )
}

export function LayoutBlueprint() {
  return (
    <div className="grid gap-tile">
      <p className="type-overline text-ink-muted">Home and collection</p>
      {/* Page anatomy */}
      <div className="overflow-hidden rounded-panel bg-surface shadow-md">
        <div className="relative">
          <DsHeader />
          <span className="absolute -bottom-2.5 left-1/2 z-20 -translate-x-1/2"><Note>header · h 64 / 88 · 1fr auto 1fr</Note></span>
        </div>
        <div className="sheet pb-6">
          <span className="absolute top-10 left-1/2 -translate-x-1/2"><Note>sheet · canvas · radius 44 top</Note></span>
          <div className="section">
            <div className="section-head">
              <h3 className="type-title">Latest drop</h3>
              <button className="pressable h-8 rounded-pill bg-surface px-4 type-body-sm">Discover more</button>
            </div>
            <div className="product-grid">
              <CardSketch tone={tones[0]} name="Thunderstruck Tee" price="Rs. 5,500" />
              <CardSketch tone={tones[1]} name="Ragnarok Tee" price="Rs. 5,500" />
              <CardSketch tone={tones[2]} name="Mothra Rising Tee" price="Rs. 5,000" />
              <CardSketch tone={tones[3]} name="Thunderstruck Hoodie" price="Rs. 14,000" />
            </div>
          </div>

          <div className="page-x">
            <div className="panel relative">
              <span className="absolute -top-2.5 left-8"><Note>panel · surface · radius 32</Note></span>
              <div className="section-head">
                <h3 className="type-title">Bags</h3>
                <button className="pressable h-8 rounded-pill bg-surface-inverse px-4 type-body-sm text-ink-inverse">Discover more</button>
              </div>
              <div className="product-grid">
                <CardSketch tone={tones[1]} name="Jacquard Card Case" price="Rs. 7,000" />
                <CardSketch tone={tones[2]} name="Crest Duffle Leather" price="Rs. 25,000" />
                <CardSketch tone={tones[0]} soldOut name="Crest Carryall" price="Rs. 35,000" />
                <CardSketch tone={tones[3]} soldOut name="Crest Carryall Jacquard" price="Rs. 30,000" />
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-head">
              <h3 className="type-title">Dense grid</h3>
              <span className="type-caption text-ink-muted">4 / 6 / 12 columns · image only</span>
            </div>
            <div className="product-grid-dense">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={`aspect-card rounded-md ${tones[i % 4]} pressable-soft`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 type-overline text-ink-muted">Product page</p>
      {/* Product page anatomy */}
      <div className="overflow-hidden rounded-panel bg-canvas p-gutter ring-1 ring-line ring-inset">
        <div className="grid gap-tile lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(20rem,0.85fr)]">
          <div className={`relative aspect-card rounded-card ${tones[0]}`}>
            <span className="absolute top-3 left-3"><Note>gallery · 2 up · radius 18</Note></span>
          </div>
          <div className={`relative hidden aspect-card rounded-card md:block ${tones[3]}`}>
            <span className="absolute top-3 left-3 grid size-7 place-items-center rounded-pill bg-white text-ink">
              <ZoomIn className="size-3.5" />
            </span>
          </div>
          <div className="flex flex-col justify-end gap-tile">
            <div className="relative rounded-xl bg-surface p-3 hairline">
              <span className="absolute -top-2.5 right-4"><Note>info card · sticky · radius 24</Note></span>
              <div className="flex items-start justify-between px-1.5 pt-1">
                <div>
                  <p className="flex items-center gap-1.5 type-heading-sm">
                    Pink Feeding Frenzy Shirt <Bookmark className="size-4 fill-current text-ink-muted" strokeWidth={0} />
                  </p>
                  <p className="type-body type-price text-ink-muted">Rs. 7,200</p>
                </div>
                <span className="mt-6 rounded-xs bg-surface-muted px-2 py-1 type-caption">Size guide</span>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1.5">
                {["XXXS", "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"].map((s, i) => (
                  <span
                    key={s}
                    className={
                      "grid h-11 place-items-center rounded-pill type-caption " +
                      (i === 0
                        ? "bg-surface-inverse text-ink-inverse"
                        : i === 8
                          ? "bg-surface-muted text-ink-subtle line-through"
                          : "hairline")
                    }
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <span className="grid h-14 place-items-center rounded-pill type-label hairline">Add to bag</span>
                <span className="grid h-14 place-items-center rounded-pill bg-surface-inverse type-label text-ink-inverse">Buy now</span>
              </div>
            </div>
            <div className="rounded-xl bg-surface p-3 hairline">
              <div className="grid grid-cols-3 border-b border-line text-center type-body-sm">
                <span className="py-2.5 text-ink-muted">Details</span>
                <span className="py-2.5 text-ink-muted">Washcare</span>
                <span className="relative py-2.5 font-medium">Shipping<span className="absolute inset-x-0 -bottom-px h-0.5 rounded-pill bg-ink" /></span>
              </div>
              <div className="space-y-1 px-8 py-4 type-body-sm text-ink-muted">
                <p>Packed within 24 hours.</p>
                <p>Free delivery nationwide.</p>
                <p>Dispatches next day.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { CollectionTile, Hero } from "@/components/store/hero"
import { ProductGrid } from "@/components/store/product-grid"
import { Section } from "@/components/ui/section"
import { collections, getProductsByCollection } from "@/lib/mock/catalog"

export default function HomePage() {
  return (
    <>
      <Hero kicker="Winter Edit 2025" title="Built for the cold" cta={{ label: "Shop now", href: "/collections/new-arrivals" }} />
      <main className="sheet sheet-overlap pb-[calc(var(--spacing-section)*0.5)]">
        <Section title="Latest drop" href="/collections/new-arrivals">
          <ProductGrid products={getProductsByCollection("new-arrivals").slice(0, 4)} priorityCount={4} />
        </Section>
        <Section title="Bags" href="/collections/accessories" inset>
          <ProductGrid products={getProductsByCollection("accessories").slice(0, 4)} reveal={false} />
        </Section>
        <Section title="Coastline Collection" href="/collections/coastline">
          <ProductGrid products={getProductsByCollection("coastline").slice(0, 4)} reveal={false} />
        </Section>
        <Section title="Shop by collection">
          <div className="grid gap-grid md:grid-cols-3">
            {collections.slice(1).map((c) => (
              <CollectionTile key={c.handle} title={c.title} blurb={c.blurb} tone={c.tone} href={`/collections/${c.handle}`} />
            ))}
          </div>
        </Section>
      </main>
    </>
  )
}

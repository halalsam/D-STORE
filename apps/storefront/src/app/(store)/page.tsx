import { CollectionTile, Hero } from "@/components/store/hero"
import { ProductGrid } from "@/components/store/product-grid"
import { Section } from "@/components/ui/section"
import { listCollections, listProducts } from "@/lib/data/catalog"

export default async function HomePage() {
  const [collections, latest, bags, coastline] = await Promise.all([
    listCollections(),
    listProducts({ collectionHandle: "new-arrivals" }),
    listProducts({ collectionHandle: "accessories" }),
    listProducts({ collectionHandle: "coastline" }),
  ])

  return (
    <>
      <Hero kicker="Winter Edit 2025" title="Built for the cold" cta={{ label: "Shop now", href: "/collections/new-arrivals" }} />
      <main className="sheet sheet-overlap pb-[calc(var(--spacing-section)*0.5)]">
        {latest.length > 0 && (
          <Section title="Latest drop" href="/collections/new-arrivals">
            <ProductGrid products={latest.slice(0, 4)} priorityCount={4} layout="rail" />
          </Section>
        )}
        {bags.length > 0 && (
          <Section title="Bags" href="/collections/accessories" inset>
            <ProductGrid products={bags.slice(0, 4)} reveal={false} layout="rail" />
          </Section>
        )}
        {coastline.length > 0 && (
          <Section title="Coastline Collection" href="/collections/coastline">
            <ProductGrid products={coastline.slice(0, 4)} reveal={false} layout="rail" />
          </Section>
        )}
        <Section title="Shop by collection">
          <div className="product-rail md:grid md:grid-cols-3 md:gap-tile [&>*]:max-md:flex-[0_0_80%] [&>*]:max-md:snap-start">
            {collections
              .filter((c) => c.handle !== "new-arrivals")
              .slice(0, 3)
              .map((c) => (
                <CollectionTile key={c.handle} title={c.title} blurb={c.blurb} tone={c.tone} href={`/collections/${c.handle}`} />
              ))}
          </div>
        </Section>
      </main>
    </>
  )
}

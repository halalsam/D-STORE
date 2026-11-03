import { CollectionTile, Hero } from "@/components/store/hero"
import { ProductGrid } from "@/components/store/product-grid"
import { Section } from "@/components/ui/section"
import { listCollections, listProducts } from "@/lib/data/catalog"

/** Collections shown as product rails; the rest become "Shop by collection" tiles. */
const RAIL_COUNT = 4

export default async function HomePage() {
  const [collections, products] = await Promise.all([listCollections(), listProducts()])
  const withProducts = collections
    .map((c) => ({ collection: c, products: products.filter((p) => p.collection === c.handle) }))
    .filter((x) => x.products.length > 0)
  const rails = withProducts.slice(0, RAIL_COUNT)
  const tiles = withProducts.slice(RAIL_COUNT, RAIL_COUNT + 3)
  // Campaign hero: the first collection with banner art.
  const campaign = withProducts.find((x) => x.collection.image)?.collection

  return (
    <>
      {campaign ? (
        <Hero
          kicker={campaign.title}
          title="Kaiju season"
          cta={{ label: "Shop the collection", href: `/collections/${campaign.handle}` }}
          src={campaign.image}
          mobileSrc={campaign.imageMobile}
          alt={`${campaign.title} campaign`}
        />
      ) : (
        <Hero kicker="Winter Edit 2025" title="Built for the cold" cta={{ label: "Shop now", href: "/collections/new-arrivals" }} />
      )}
      <main className="sheet sheet-overlap pb-[calc(var(--spacing-section)*0.5)]">
        {rails.map(({ collection: c, products: list }, i) => (
          <Section key={c.handle} title={c.title} href={`/collections/${c.handle}`} inset={i % 2 === 1}>
            <ProductGrid products={list.slice(0, 4)} priorityCount={i === 0 ? 4 : 0} reveal={i === 0} layout="rail" />
          </Section>
        ))}
        {tiles.length > 0 && (
          <Section title="Shop by collection">
            <div className="product-rail md:grid md:grid-cols-3 md:gap-tile [&>*]:max-md:flex-[0_0_80%] [&>*]:max-md:snap-start">
              {tiles.map(({ collection: c, products: list }) => (
                <CollectionTile
                  key={c.handle}
                  title={c.title}
                  blurb={c.blurb}
                  tone={c.tone}
                  src={c.imageMobile ?? c.image ?? list.find((p) => p.images.length > 1)?.images[1] ?? list[0].images[0]}
                  href={`/collections/${c.handle}`}
                />
              ))}
            </div>
          </Section>
        )}
      </main>
    </>
  )
}

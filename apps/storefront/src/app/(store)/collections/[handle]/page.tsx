import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { CollectionView } from "@/components/store/collection-view"
import { SeoBlock } from "@/components/store/seo-block"
import { getCollection, listCollections, listProducts } from "@/lib/data/catalog"

export async function generateStaticParams() {
  const collections = await listCollections()
  return collections.map((c) => ({ handle: c.handle }))
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollection(handle)
  return { title: collection?.title ?? "Collection", description: collection?.blurb }
}

function CollectionSkeleton() {
  return (
    <main className="sheet">
      <section className="section">
        <div className="section-head">
          <div className="h-5 w-40 rounded-pill skeleton" />
          <div className="h-10 w-56 rounded-pill skeleton" />
        </div>
        <div className="product-grid gap-y-6">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-card rounded-card skeleton" />)}
        </div>
      </section>
    </main>
  )
}

export default function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  return (
    <Suspense fallback={<CollectionSkeleton />}>
      <Collection params={params} />
    </Suspense>
  )
}

async function Collection({ params }: { params: PageProps<"/collections/[handle]">["params"] }) {
  const { handle } = await params
  const collection = await getCollection(handle)
  if (!collection) notFound()
  const products = await listProducts({ collectionHandle: handle })

  return (
    <main className="sheet">
      <CollectionView title={collection.title} products={products} />
      <SeoBlock
        title={`${collection.title}${collection.blurb ? `: ${collection.blurb.replace(/\.$/, "")}` : ""}`}
        body={`${collection.blurb} Every piece is cut in-house from heavyweight fabrics and finished by hand, with prints developed in small runs so nothing is made twice. Free delivery nationwide, easy fourteen day returns, and new drops every few weeks. Browse by size, colour or type with the advanced filters, or switch to the dense grid to see the whole collection at once.`}
      />
    </main>
  )
}

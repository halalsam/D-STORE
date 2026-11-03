import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { CollectionView } from "@/components/store/collection-view"
import { SeoBlock } from "@/components/store/seo-block"
import { collections, getCollection, getProductsByCollection } from "@/lib/mock/catalog"

export function generateStaticParams() {
  return collections.map((c) => ({ handle: c.handle }))
}

export async function generateMetadata({ params }: PageProps<"/collections/[handle]">): Promise<Metadata> {
  const { handle } = await params
  return { title: getCollection(handle)?.title ?? "Collection" }
}

export default async function CollectionPage({ params }: PageProps<"/collections/[handle]">) {
  const { handle } = await params
  const collection = getCollection(handle)
  if (!collection) notFound()

  return (
    <main className="sheet">
      <CollectionView title={collection.title} products={getProductsByCollection(handle)} />
      <SeoBlock
        title={`${collection.title}: ${collection.blurb.replace(/\.$/, "")}`}
        body={`${collection.blurb} Every piece is cut in-house from heavyweight fabrics and finished by hand, with prints developed in small runs so nothing is made twice. Free delivery nationwide, easy fourteen day returns, and new drops every few weeks. Browse by size, colour or type with the advanced filters, or switch to the dense grid to see the whole collection at once.`}
      />
    </main>
  )
}

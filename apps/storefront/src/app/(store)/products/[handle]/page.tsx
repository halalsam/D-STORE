import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductPurchase, ProductTabs } from "@/components/store/product-info"
import { ProductShowcase } from "@/components/store/product-showcase"
import { SectionHeader } from "@/components/ui/section"
import { getProduct, getProductsByCollection, isSoldOut, products } from "@/lib/mock/catalog"

export function generateStaticParams() {
  return products.map((p) => ({ handle: p.handle }))
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params
  return { title: getProduct(handle)?.title ?? "Product" }
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const { handle } = await params
  const product = getProduct(handle)
  if (!product) notFound()
  const related = getProductsByCollection(product.collection).filter((p) => p.id !== product.id).slice(0, 4)
  // TODO: replace with curated "complete the look" links from Medusa (product metadata or a module link).
  const pairs = products.filter((p) => p.collection !== product.collection && !isSoldOut(p)).slice(0, 3)

  return (
    <main className="sheet pt-[calc(var(--radius-sheet)*0.5)]">
      <ProductShowcase
        product={product}
        pairs={pairs}
        details={
          <>
            <ProductPurchase product={product} />
            <ProductTabs product={product} />
          </>
        }
      />

      {related.length > 0 && (
        <section className="page-x pt-section pb-[calc(var(--spacing-section)*0.5)]">
          <div className="panel">
            <SectionHeader title="You may also like" href={`/collections/${product.collection}`} onPanel />
            <ProductGrid products={related} reveal={false} />
          </div>
        </section>
      )}
    </main>
  )
}

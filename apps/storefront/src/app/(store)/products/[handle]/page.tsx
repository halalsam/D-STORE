import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProductGallery } from "@/components/store/product-gallery"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductInfo } from "@/components/store/product-info"
import { Section } from "@/components/ui/section"
import { getProduct, getProductsByCollection, products } from "@/lib/mock/catalog"

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

  return (
    <main className="sheet">
      <div className="page-x grid gap-grid pb-section lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(21rem,0.85fr)]">
        <ProductGallery product={product} />
        <aside className="lg:sticky lg:top-(--header-h) lg:flex lg:h-[calc(100dvh-var(--header-h))] lg:flex-col lg:justify-end lg:self-start lg:pb-gutter">
          <ProductInfo product={product} />
        </aside>
      </div>
      {related.length > 0 && (
        <Section title="You may also like" href={`/collections/${product.collection}`} inset>
          <ProductGrid products={related} reveal={false} />
        </Section>
      )}
    </main>
  )
}

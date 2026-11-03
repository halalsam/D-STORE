import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductPurchase, ProductTabs } from "@/components/store/product-info"
import { ProductShowcase } from "@/components/store/product-showcase"
import { SectionHeader } from "@/components/ui/section"
import { getProduct, listProducts } from "@/lib/data/catalog"
import { isSoldOut } from "@/lib/types"

export async function generateStaticParams() {
  const products = await listProducts()
  return products.map((p) => ({ handle: p.handle }))
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  return { title: product?.title ?? "Product", description: product?.description }
}

function ProductSkeleton() {
  return (
    <main className="sheet pt-[calc(var(--radius-sheet)*0.5)]">
      <div className="page-x pdp-grid">
        <div className="aspect-card w-full rounded-card skeleton" />
        <div className="hidden aspect-card rounded-card skeleton lg:block" />
        <div className="grid content-start gap-tile">
          <div className="h-72 rounded-xl skeleton" />
          <div className="h-40 rounded-xl skeleton" />
        </div>
      </div>
    </main>
  )
}

export default function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  )
}

async function ProductContent({ params }: { params: PageProps<"/products/[handle]">["params"] }) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()
  const all = await listProducts()
  const related = all.filter((p) => p.collection === product.collection && p.id !== product.id).slice(0, 4)
  // TODO: curated "complete the look" (product metadata or a module link).
  const pairs = all.filter((p) => p.collection !== product.collection && !isSoldOut(p)).slice(0, 3)

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

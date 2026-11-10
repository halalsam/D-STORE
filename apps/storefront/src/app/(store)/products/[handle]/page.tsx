import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { GiftCardPurchase } from "@/components/store/gift-card-purchase"
import { ProductAccordion, SizeFitSection } from "@/components/store/product-details"
import { ProductGallery } from "@/components/store/product-gallery"
import { ProductGrid } from "@/components/store/product-grid"
import { ProductPurchase } from "@/components/store/product-info"
import { productViews } from "@/components/store/product-media"
import { ProductReviews, RatingSummaryLink, ReviewsTab } from "@/components/store/product-reviews"
import { SectionHeader } from "@/components/ui/section"
import { getProduct, listProducts } from "@/lib/data/catalog"
import { getProductReviews } from "@/lib/data/reviews"
import { isSoldOut } from "@/lib/types"

export async function generateStaticParams() {
  const products = await listProducts()
  return products.map((p) => ({ handle: p.handle }))
}

export async function generateMetadata({ params }: PageProps<"/products/[handle]">): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  return {
    title: product?.title ?? "Product",
    description: product?.description,
    ...(product?.images[0] ? { openGraph: { images: [{ url: product.images[0] }] } } : {}),
  }
}

function ProductSkeleton() {
  return (
    <main className="sheet pt-[calc(var(--radius-sheet)*0.5)]" aria-busy>
      <div className="page-x pdp-layout">
        <div className="min-w-0">
          <div className="lg:hidden">
            <div className="-mx-gutter flex gap-tile overflow-hidden px-gutter">
              <div className="aspect-card w-[86%] shrink-0 rounded-card skeleton sm:w-[62%]" />
              <div className="aspect-card w-[86%] shrink-0 rounded-card skeleton sm:w-[62%]" />
            </div>
            <div className="mt-3 flex justify-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full skeleton" />
              {Array.from({ length: 3 }, (_, i) => <span key={i} className="size-1.5 rounded-full skeleton" />)}
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-tile lg:grid">
            <div className="aspect-card rounded-card skeleton" />
            <div className="aspect-card rounded-card skeleton" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-tile">
          <div className="rounded-xl bg-surface p-4 md:p-5">
            <div className="h-3 w-24 rounded-pill skeleton" />
            <div className="mt-3 h-6 w-3/4 rounded-sm skeleton" />
            <div className="mt-2.5 h-5 w-28 rounded-sm skeleton" />
            <div className="mt-5 h-4 w-12 rounded-sm skeleton" />
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-11 rounded-pill skeleton" />)}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <div className="h-14 rounded-pill skeleton" />
              <div className="h-14 rounded-pill skeleton" />
            </div>
          </div>
          <div className="rounded-xl bg-surface px-5">
            <div className="py-4">
              <div className="h-5 w-28 rounded-sm skeleton" />
              <div className="mt-5 grid gap-2">
                <div className="h-3.5 w-full rounded-sm skeleton" />
                <div className="h-3.5 w-11/12 rounded-sm skeleton" />
                <div className="h-3.5 w-2/3 rounded-sm skeleton" />
              </div>
            </div>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex h-14 items-center">
                <div className="h-5 w-32 rounded-sm skeleton" />
              </div>
            ))}
          </div>
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
  const [all, { stats, reviews }] = await Promise.all([listProducts(), getProductReviews(product.id)])
  const related = all.filter((p) => p.collection === product.collection && p.id !== product.id).slice(0, 4)
  // TODO: curated "wear it with" (product metadata or a module link).
  const pairs = product.giftCard ? [] : all.filter((p) => p.collection !== product.collection && !isSoldOut(p) && !p.giftCard).slice(0, 4)

  // One photo is held back for the size and fit section, so no picture shows twice.
  const views = productViews(product)
  const hasSizeSection = !product.giftCard && product.sizeChart !== null && product.sizes.length > 1
  const reserve = hasSizeSection && views.length >= 4
  const tag = isSoldOut(product) ? "Sold out" : product.badge
  const rating = <RatingSummaryLink stats={stats} />

  return (
    <main className="sheet pt-[calc(var(--radius-sheet)*0.5)]">
      <div className="page-x pdp-layout">
        <ProductGallery product={product} views={reserve ? views.slice(0, -1) : views} tag={tag} />
        <aside className="pdp-panel no-scrollbar flex min-w-0 flex-col gap-tile">
          {product.giftCard ? <GiftCardPurchase product={product} rating={rating} /> : <ProductPurchase product={product} rating={rating} />}
          <ProductAccordion
            product={product}
            reviewCount={stats.count}
            reviews={<ReviewsTab productId={product.id} productTitle={product.title} handle={product.handle} stats={stats} reviews={reviews} />}
          />
        </aside>
      </div>

      <SizeFitSection product={product} view={reserve ? views.at(-1) : undefined} />

      <ProductReviews productId={product.id} productTitle={product.title} handle={product.handle} stats={stats} reviews={reviews} />

      {pairs.length > 0 && (
        <section className="page-x pt-section">
          <div className="panel">
            <SectionHeader title="Wear it with" onPanel />
            <ProductGrid products={pairs} reveal={false} layout="rail" />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="page-x pt-section pb-[calc(var(--spacing-section)*0.5)]">
          <div className="panel">
            <SectionHeader title={`More from ${product.collectionTitle ?? "this collection"}`} href={`/collections/${product.collection}`} onPanel />
            <ProductGrid products={related} reveal={false} layout="rail" />
          </div>
        </section>
      )}
    </main>
  )
}

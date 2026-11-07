import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchView, SearchViewFallback } from "@/components/store/search-view"
import { listProducts } from "@/lib/data/catalog"
import { searchProducts } from "@/lib/data/search"

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const q = (await searchParams).q
  const query = typeof q === "string" ? q.trim() : ""
  return { title: query ? `Search: ${query}` : "Search", robots: { index: false } }
}

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <main className="sheet min-h-[80dvh]">
      <Suspense fallback={<SearchViewFallback />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function Results({ searchParams }: { searchParams: PageProps<"/search">["searchParams"] }) {
  const q = (await searchParams).q
  const query = typeof q === "string" ? q : ""
  const [results, latest] = await Promise.all([
    searchProducts(query),
    listProducts({ collectionHandle: "new-arrivals" }),
  ])
  return <SearchView results={results} latest={latest.slice(0, 4)} />
}

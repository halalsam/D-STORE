import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "@/lib/medusa"
import type { Review, ReviewStats } from "@/lib/types"
import { demoReviews } from "./mock-backend"
import { DEMO_MODE } from "./mode"

/** Approved reviews only (the backend enforces it). Public, so cached like the catalog. */

type StatsRow = { average_rating: number | null; review_count: number } & Record<`rating_count_${1 | 2 | 3 | 4 | 5}`, number>
type ReviewRow = {
  id: string
  name: string | null
  rating: number
  content: string | null
  created_at: string
  images?: { url: string }[]
  response?: { content: string } | null
}

export const emptyReviewStats: ReviewStats = { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] }

function toStats(row: StatsRow | undefined): ReviewStats {
  if (!row?.review_count) return emptyReviewStats
  return {
    average: Number(row.average_rating ?? 0),
    count: row.review_count,
    distribution: [row.rating_count_1, row.rating_count_2, row.rating_count_3, row.rating_count_4, row.rating_count_5].map((n) => n ?? 0) as ReviewStats["distribution"],
  }
}

function toReview(r: ReviewRow): Review {
  return {
    id: r.id,
    name: r.name?.trim() || "Verified buyer",
    rating: r.rating,
    content: r.content ?? "",
    createdAt: r.created_at,
    images: [...new Set((r.images ?? []).map((i) => i.url))],
    response: r.response?.content || undefined,
  }
}

export async function getProductReviews(productId: string): Promise<{ stats: ReviewStats; reviews: Review[] }> {
  "use cache"
  cacheLife("minutes")
  cacheTag("reviews", `reviews:${productId}`)
  if (DEMO_MODE) return demoReviews(productId)
  try {
    const [stats, list] = await Promise.all([
      sdk.client.fetch<{ product_review_stats: StatsRow[] }>("/store/product-review-stats", { query: { product_id: productId } }),
      sdk.client.fetch<{ product_reviews: ReviewRow[] }>("/store/product-reviews", { query: { product_id: productId, limit: 30, order: "-created_at" } }),
    ])
    return { stats: toStats(stats.product_review_stats[0]), reviews: list.product_reviews.map(toReview) }
  } catch {
    return { stats: emptyReviewStats, reviews: [] }
  }
}

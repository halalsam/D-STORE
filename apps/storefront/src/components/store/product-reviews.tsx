import Link from "next/link"
import { cache, Suspense } from "react"
import { getReviewEligibility as fetchEligibility } from "@/lib/data/review-actions"
import { formatDate } from "@/lib/format"
import type { Review, ReviewStats } from "@/lib/types"
import { ReviewForm } from "./review-form"
import { Stars } from "./stars"

export function RatingSummaryLink({ stats }: { stats: ReviewStats }) {
  if (!stats.count) return null
  return (
    <a href="#reviews" className="pressable mt-1.5 inline-flex items-center gap-1.5 type-caption text-ink-muted hover:text-ink">
      <Stars rating={stats.average} className="text-[0.9rem]" />
      <span className="tabular-nums">{stats.average.toFixed(1)}</span>
      <span>({stats.count})</span>
    </a>
  )
}

// The details tab and the full section both render the action; one lookup per request.
const getReviewEligibility = cache(fetchEligibility)

async function ReviewAction({ productId, productTitle, handle }: { productId: string; productTitle: string; handle: string }) {
  const eligibility = await getReviewEligibility(productId)
  if (eligibility.kind === "demo") {
    return <p className="type-caption text-ink-muted">Demo store: these are sample reviews, not from real buyers. Writing reviews is turned off.</p>
  }
  if (eligibility.kind === "signed-out") {
    return (
      <p className="type-body-sm text-ink-muted">
        Bought this? <Link href={`/sign-in?next=/products/${handle}%23reviews`} className="text-accent-ink underline underline-offset-2">Sign in</Link> to review it.
      </p>
    )
  }
  if (eligibility.kind === "not-purchased") {
    return <p className="type-body-sm text-ink-muted">Only shoppers who bought this can review it.</p>
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ReviewForm productTitle={productTitle} target={eligibility} />
      {eligibility.existing?.status === "pending" && <span className="type-caption text-ink-muted">Your review is waiting for approval.</span>}
    </div>
  )
}

function Distribution({ stats }: { stats: ReviewStats }) {
  return (
    <ul className="grid gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const n = stats.distribution[star - 1]
        const pct = stats.count ? (n / stats.count) * 100 : 0
        return (
          <li key={star} className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 type-caption text-ink-muted">
            <span className="tabular-nums">{star} star</span>
            <span className="h-1.5 overflow-hidden rounded-pill bg-surface-muted">
              <span className="block h-full rounded-pill bg-surface-inverse" style={{ width: `${pct}%` }} />
            </span>
            <span className="text-right tabular-nums">{n}</span>
          </li>
        )
      })}
    </ul>
  )
}

function ReviewItem({ review, compact = false }: { review: Review; compact?: boolean }) {
  return (
    <li className={compact ? "grid gap-1.5 border-t border-line py-3 first:border-t-0 first:pt-0" : "grid gap-2 border-t border-line py-5 first:border-t-0 first:pt-0"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stars rating={review.rating} className="text-[0.95rem]" />
          <span className="type-body-sm font-medium">{review.name}</span>
          <span className="type-caption text-ink-subtle">{review.sample ? "Sample review" : "Verified buyer"}</span>
        </div>
        <time dateTime={review.createdAt} className="type-caption text-ink-subtle">{formatDate(review.createdAt)}</time>
      </div>
      {review.content && <p className={compact ? "line-clamp-3 type-body-sm text-ink-muted" : "max-w-[65ch] type-body-sm whitespace-pre-line text-ink-muted"}>{review.content}</p>}
      {!compact && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.images.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="pressable block size-20 overflow-hidden rounded-md bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Photo from ${review.name}`} loading="lazy" className="size-full object-cover" />
            </a>
          ))}
        </div>
      )}
      {!compact && review.response && (
        <div className="mt-1 rounded-md bg-surface-muted px-4 py-3">
          <p className="type-overline text-ink-muted">Reply from D-STORE</p>
          <p className="mt-1 type-body-sm text-ink-muted">{review.response}</p>
        </div>
      )}
    </li>
  )
}

type SectionProps = { productId: string; productTitle: string; handle: string; stats: ReviewStats; reviews: Review[] }

/** Compact reviews for the product details tabs, next to the buy box. The full list is the #reviews section. */
export function ReviewsTab({ productId, productTitle, handle, stats, reviews }: SectionProps) {
  const latest = reviews.slice(0, 3)
  return (
    <div className="grid gap-4">
      {stats.count ? (
        <a href="#reviews" className="pressable flex items-center gap-2 text-ink">
          <span className="type-heading-sm tabular-nums">{stats.average.toFixed(1)}</span>
          <Stars rating={stats.average} className="text-base" />
          <span className="type-caption text-ink-muted">{stats.count} {stats.count === 1 ? "review" : "reviews"}</span>
        </a>
      ) : (
        <p>No reviews yet. Be the first to share how it fits.</p>
      )}
      {latest.length > 0 && <ul className="grid">{latest.map((r) => <ReviewItem key={r.id} review={r} compact />)}</ul>}
      {stats.count > latest.length && (
        <a href="#reviews" className="pressable justify-self-start type-body-sm text-accent-ink underline underline-offset-2">
          Read all {stats.count} reviews
        </a>
      )}
      <Suspense fallback={<div className="h-10 w-40 rounded-pill skeleton" />}>
        <ReviewAction productId={productId} productTitle={productTitle} handle={handle} />
      </Suspense>
    </div>
  )
}

export function ProductReviews({ productId, productTitle, handle, stats, reviews }: { productId: string; productTitle: string; handle: string; stats: ReviewStats; reviews: Review[] }) {
  return (
    <section id="reviews" className="page-x scroll-mt-24 pt-section">
      <div className="panel grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
        <div className="grid content-start gap-4">
          <h2 className="type-heading-sm">Reviews</h2>
          {stats.count ? (
            <>
              <div className="flex items-end gap-3">
                <span className="type-display-lg leading-none tabular-nums">{stats.average.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars rating={stats.average} className="text-base" />
                  <p className="type-caption text-ink-muted">{stats.count} {stats.count === 1 ? "review" : "reviews"}</p>
                </div>
              </div>
              <Distribution stats={stats} />
            </>
          ) : (
            <p className="type-body-sm text-ink-muted">No reviews yet.</p>
          )}
          <Suspense fallback={<div className="h-10 w-40 rounded-pill skeleton" />}>
            <ReviewAction productId={productId} productTitle={productTitle} handle={handle} />
          </Suspense>
        </div>
        {reviews.length > 0 ? (
          <ul>{reviews.map((r) => <ReviewItem key={r.id} review={r} />)}</ul>
        ) : (
          <p className="self-center type-body-sm text-ink-muted lg:text-center">Be the first to share how it fits.</p>
        )}
      </div>
    </section>
  )
}

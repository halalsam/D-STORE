"use client"

import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X } from "@/components/ui/icons"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { submitReview, uploadReviewPhoto } from "@/lib/data/review-actions"
import type { ReviewEligibility } from "@/lib/types"
import { cn } from "@/lib/utils"

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"]
const MAX_PHOTOS = 4

/** Keeps uploads small (and under the server action body limit) whatever the phone camera produces. */
async function downscale(file: File, max = 1600): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85))
}

export function ReviewForm({ productTitle, target }: { productTitle: string; target: Extract<ReviewEligibility, { kind: "can-review" }> }) {
  const router = useRouter()
  const existing = target.existing
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [hover, setHover] = useState(0)
  const [content, setContent] = useState(existing?.content ?? "")
  const [photos, setPhotos] = useState<string[]>(existing?.images ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(undefined)
    for (const file of [...files].slice(0, MAX_PHOTOS - photos.length)) {
      try {
        const form = new FormData()
        form.append("files", new File([await downscale(file)], "review.jpg", { type: "image/jpeg" }))
        const res = await uploadReviewPhoto(form)
        if (res.ok) setPhotos((p) => (p.includes(res.data.url) ? p : [...p, res.data.url]))
        else setError(res.error)
      } catch {
        setError("That photo could not be read")
      }
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const submit = () => {
    if (!rating) return setError("Choose a rating")
    if (content.trim().length < 10) return setError("Tell other shoppers a little more (10 characters or more)")
    setError(undefined)
    start(async () => {
      const res = await submitReview({ orderId: target.orderId, lineId: target.lineId, rating, content, images: photos })
      if (!res.ok) return setError(res.error)
      setOpen(false)
      toast("Thanks. Your review will appear once we have checked it.")
      router.refresh()
    })
  }

  const shown = hover || rating

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="md">{existing ? "Edit your review" : "Write a review"}</Button>
      </SheetTrigger>
      <SheetContent
        side="adaptive"
        title={existing ? "Edit your review" : "Write a review"}
        subtitle={productTitle}
        bodyClassName="grid gap-5 p-4 md:p-6"
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="lg" loading={pending} disabled={uploading} onClick={submit}>Submit</Button>
          </>
        }
      >
        <div>
          <p className="mb-2 type-body-sm">Your rating</p>
          <div className="flex items-center gap-3">
            <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => setRating(n)}
                  className="pressable grid size-10 place-items-center rounded-full hover:bg-surface-muted"
                >
                  <svg viewBox="0 0 24 24" className={cn("size-7 transition-colors", n <= shown ? "text-ink" : "text-line-strong")} aria-hidden>
                    <path fill="currentColor" d="M12 2.6l2.83 5.94 6.47.82-4.76 4.5 1.22 6.42L12 17.13l-5.76 3.15 1.22-6.42-4.76-4.5 6.47-.82z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="type-body-sm text-ink-muted">{LABELS[shown]}</span>
          </div>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="review-content" className="type-body-sm">Your review</label>
          <textarea
            id="review-content"
            rows={5}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Fit, fabric, how it washed..."
            className="rounded-md bg-surface px-4 py-3 type-body text-ink ring-1 ring-line-strong ring-inset outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <p className="mb-2 type-body-sm">Photos <span className="text-ink-muted">(optional, up to {MAX_PHOTOS})</span></p>
          <div className="flex flex-wrap gap-2">
            {photos.map((url) => (
              <div key={url} className="relative size-20 overflow-hidden rounded-md bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                  className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-surface/90 text-ink"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className={cn("pressable grid size-20 cursor-pointer place-items-center rounded-md text-ink-muted ring-1 ring-line-strong ring-inset ring-dashed hover:bg-surface-muted", uploading && "animate-pulse")}>
                <ImagePlus className="size-6" />
                <span className="sr-only">Add photos</span>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => void addPhotos(e.target.files)} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        {error && <p className="type-caption text-danger">{error}</p>}
        <p className="type-caption text-ink-muted">Reviews show your first name and last name from the order. We check every review before it goes live.</p>
      </SheetContent>
    </Sheet>
  )
}

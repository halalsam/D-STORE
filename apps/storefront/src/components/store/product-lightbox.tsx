"use client"

import { Dialog } from "radix-ui"
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Minus, Plus, X } from "@/components/ui/icons"
import { isSoldOut, type Product, type Tone } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProductMedia } from "./product-media"
import { QuickAdd } from "./quick-add"

type View = { tone: Tone; src?: string }
type Zoom = { s: number; x: number; y: number }

const MAX = 4
const STEP = 2.5
const REST: Zoom = { s: 1, x: 0, y: 0 }

type Props = {
  product: Product
  views: View[]
  alt: (i: number) => string
  /** Index to open at, or null when closed. */
  start: number | null
  onClose: () => void
}

export function ProductLightbox({ product, views, alt, start, onClose }: Props) {
  return (
    <Dialog.Root open={start !== null} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {start !== null && <Viewer product={product} views={views} alt={alt} start={start} />}
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Viewer({ product, views, alt, start }: Omit<Props, "start" | "onClose"> & { start: number }) {
  const [index, setIndex] = useState(start)
  const [zoom, setZoom] = useState<Zoom>(REST)
  const [dragging, setDragging] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ zoom: Zoom; dist: number; mid: { x: number; y: number } } | null>(null)
  const lastTap = useRef({ t: 0, x: 0, y: 0 })
  const lastPointer = useRef("mouse")
  const zoomed = zoom.s > 1
  const many = views.length > 1

  const clamp = useCallback((z: Zoom): Zoom => {
    const el = stage.current
    if (!el || z.s <= 1) return REST
    const mx = ((z.s - 1) * el.clientWidth) / 2
    const my = ((z.s - 1) * el.clientHeight) / 2
    return { s: z.s, x: Math.max(-mx, Math.min(mx, z.x)), y: Math.max(-my, Math.min(my, z.y)) }
  }, [])

  // Offset of a viewport point from the stage centre.
  const fromCentre = (cx: number, cy: number) => {
    const r = stage.current!.getBoundingClientRect()
    return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) }
  }

  const zoomTo = useCallback(
    (s: number, at?: { x: number; y: number }) => {
      setZoom((z) => {
        const next = Math.max(1, Math.min(MAX, s))
        const p = at ?? { x: 0, y: 0 }
        // Keep the content point under `at` fixed while the scale changes.
        const cx = (p.x - z.x) / z.s
        const cy = (p.y - z.y) / z.s
        return clamp({ s: next, x: p.x - cx * next, y: p.y - cy * next })
      })
    },
    [clamp]
  )

  const toggleZoom = (at?: { x: number; y: number }) => (zoomed ? setZoom(REST) : zoomTo(STEP, at))

  const go = (i: number) => {
    const el = track.current
    if (!el) return
    const next = (i + views.length) % views.length
    setZoom(REST)
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" })
  }

  const trackRef = useCallback(
    (el: HTMLDivElement | null) => {
      track.current = el
      if (el) el.scrollLeft = start * el.clientWidth
    },
    [start]
  )

  useEffect(() => {
    const el = stage.current
    if (!el) return
    // Trackpad pinch arrives as ctrl+wheel; it must be non-passive to stop page zoom.
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        setZoom((z) => {
          const r = el.getBoundingClientRect()
          const p = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) }
          const s = Math.max(1, Math.min(MAX, z.s * Math.exp(-e.deltaY / 100)))
          const cx = (p.x - z.x) / z.s
          const cy = (p.y - z.y) / z.s
          return clamp({ s, x: p.x - cx * s, y: p.y - cy * s })
        })
      } else if (zoomed) {
        e.preventDefault()
        setZoom((z) => clamp({ ...z, x: z.x - e.deltaX, y: z.y - e.deltaY }))
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [clamp, zoomed])

  useEffect(() => {
    const onResize = () => {
      setZoom(REST)
      if (track.current) track.current.scrollLeft = index * track.current.clientWidth
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [index])

  const onPointerDown = (e: ReactPointerEvent) => {
    lastPointer.current = e.pointerType
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2 || zoomed) {
      e.currentTarget.setPointerCapture(e.pointerId)
      const pts = [...pointers.current.values()]
      const mid = pts.length === 2 ? { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 } : pts[0]
      const dist = pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0
      gesture.current = { zoom, dist, mid }
      setDragging(true)
    }
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    const pts = [...pointers.current.values()]
    if (pts.length === 2 && g.dist > 0) {
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }
      const s = Math.max(1, Math.min(MAX, (g.zoom.s * Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)) / g.dist))
      const from = fromCentre(g.mid.x, g.mid.y)
      const now = fromCentre(mid.x, mid.y)
      const cx = (from.x - g.zoom.x) / g.zoom.s
      const cy = (from.y - g.zoom.y) / g.zoom.s
      setZoom(clamp({ s, x: now.x - cx * s, y: now.y - cy * s }))
    } else if (pts.length === 1 && g.zoom.s > 1) {
      setZoom(clamp({ ...g.zoom, x: g.zoom.x + pts[0].x - g.mid.x, y: g.zoom.y + pts[0].y - g.mid.y }))
    }
  }

  const onPointerUp = (e: ReactPointerEvent) => {
    const down = pointers.current.get(e.pointerId)
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 1 && zoom.s > 1) {
      // One finger lifted mid-pinch: carry on panning with the other.
      gesture.current = { zoom, dist: 0, mid: [...pointers.current.values()][0] }
      return
    }
    if (pointers.current.size > 0) return
    gesture.current = null
    setDragging(false)
    if (zoom.s < 1.05) setZoom(REST)

    if (e.type !== "pointercancel" && e.pointerType !== "mouse" && down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) {
      const now = e.timeStamp
      const t = lastTap.current
      if (now - t.t < 300 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 30) {
        lastTap.current = { t: 0, x: 0, y: 0 }
        toggleZoom(fromCentre(e.clientX, e.clientY))
      } else {
        lastTap.current = { t: now, x: e.clientX, y: e.clientY }
      }
    }
  }

  return (
    <Dialog.Content
      aria-describedby={undefined}
      onEscapeKeyDown={(e) => {
        if (zoomed) {
          e.preventDefault()
          setZoom(REST)
        }
      }}
      onKeyDown={(e) => {
        if (!many) return
        if (e.key === "ArrowRight") go(index + 1)
        else if (e.key === "ArrowLeft") go(index - 1)
        else return
        e.preventDefault()
      }}
      className="fixed inset-0 z-(--z-drawer) flex flex-col bg-canvas text-ink outline-none data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 pr-2 pl-(--spacing-gutter) md:h-16">
        <div className="min-w-0 flex-1">
          <Dialog.Title className="truncate type-body-sm font-medium">{product.title}</Dialog.Title>
          {many && (
            <p aria-live="polite" className="type-caption text-ink-muted tabular-nums">
              {index + 1} of {views.length}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label={zoomed ? "Zoom out" : "Zoom in"} onClick={() => toggleZoom()}>
          {zoomed ? <Minus strokeWidth={1.6} /> : <Plus strokeWidth={1.6} />}
        </Button>
        <Dialog.Close asChild>
          <Button variant="ghost" size="icon" aria-label="Close">
            <X strokeWidth={1.6} />
          </Button>
        </Dialog.Close>
      </header>

      <div ref={stage} className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          aria-roledescription="carousel"
          onScroll={(e) => {
            const el = e.currentTarget
            const i = Math.round(el.scrollLeft / el.clientWidth)
            if (i !== index) {
              setIndex(i)
              setZoom(REST)
            }
          }}
          className={cn("no-scrollbar absolute inset-0 flex snap-x snap-mandatory overscroll-x-contain", zoomed ? "overflow-hidden" : "overflow-x-auto")}
        >
          {views.map((v, i) => {
            const current = i === index
            const z = current ? zoom : REST
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${views.length}`}
                className={cn("relative size-full shrink-0 snap-center overflow-hidden", zoomed ? "touch-none" : "touch-pan-x")}
                onPointerDown={current ? onPointerDown : undefined}
                onPointerMove={current ? onPointerMove : undefined}
                onPointerUp={current ? onPointerUp : undefined}
                onPointerCancel={current ? onPointerUp : undefined}
                onDoubleClick={(e) => current && lastPointer.current === "mouse" && toggleZoom(fromCentre(e.clientX, e.clientY))}
              >
                <div
                  className={cn(
                    "absolute inset-0 grid place-items-center p-3 will-change-transform md:p-6",
                    !dragging && "transition-transform duration-(--duration-base) ease-standard motion-reduce:transition-none",
                    zoomed ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
                  )}
                  style={{ transform: `translate3d(${z.x}px, ${z.y}px, 0) scale(${z.s})` }}
                >
                  {v.src ? (
                    <div className="relative size-full">
                      <ProductMedia
                        tone={v.tone}
                        src={v.src}
                        alt={alt(i)}
                        sizes="100vw"
                        priority={Math.abs(i - start) <= 1}
                        className="pointer-events-none object-contain select-none"
                      />
                    </div>
                  ) : (
                    <div className="relative aspect-card max-h-full w-[min(100%,calc((100dvh-12rem)*0.75))] overflow-hidden rounded-card">
                      <ProductMedia tone={v.tone} silhouette={product.silhouette} alt={alt(i)} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {many && (
          <>
            <Button variant="media" size="icon-lg" aria-label="Previous photo" onClick={() => go(index - 1)} className="absolute top-1/2 left-4 hidden -translate-y-1/2 md:inline-flex">
              <ArrowLeft strokeWidth={1.6} />
            </Button>
            <Button variant="media" size="icon-lg" aria-label="Next photo" onClick={() => go(index + 1)} className="absolute top-1/2 right-4 hidden -translate-y-1/2 md:inline-flex">
              <ArrowRight strokeWidth={1.6} />
            </Button>
          </>
        )}

        {!product.giftCard && !isSoldOut(product) && (
          <QuickAdd product={product} appearance="media" className="absolute right-3 bottom-3 md:right-4 md:bottom-4" />
        )}
      </div>

      {many && (
        <nav aria-label="Photos" className="no-scrollbar flex shrink-0 justify-center-safe gap-2 overflow-x-auto px-(--spacing-gutter) pt-3 pb-[max(var(--spacing-gutter),env(safe-area-inset-bottom))]">
          {views.map((v, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index || undefined}
              onClick={() => go(i)}
              className={cn(
                "pressable relative aspect-card w-11 shrink-0 overflow-hidden rounded-sm bg-surface-muted transition-opacity duration-(--duration-fast) md:w-14",
                i === index ? "ring-2 ring-ink ring-offset-2 ring-offset-canvas" : "opacity-50 hover:opacity-100"
              )}
            >
              <ProductMedia tone={v.tone} src={v.src} silhouette={product.silhouette} alt="" sizes="56px" />
            </button>
          ))}
        </nav>
      )}
    </Dialog.Content>
  )
}

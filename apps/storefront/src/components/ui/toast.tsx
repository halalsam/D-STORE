"use client"

import { createStore, useStore } from "@/lib/stores/create-store"
import { cn } from "@/lib/utils"
import { Check, X } from "./icons"

type Toast = { id: number; message: string; tone: "default" | "error" }
const toastStore = createStore<Toast[]>([])
let nextId = 1

/** Show a short iOS-style pill at the bottom of the screen. */
export function toast(message: string, tone: Toast["tone"] = "default") {
  const id = nextId++
  toastStore.set((list) => [...list.slice(-2), { id, message, tone }])
  setTimeout(() => toastStore.set((list) => list.filter((t) => t.id !== id)), 3200)
}

export function Toaster() {
  const toasts = useStore(toastStore)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[max(5.25rem,calc(env(safe-area-inset-bottom)+4.5rem))] md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-(--z-toast) grid justify-items-center gap-2 px-gutter">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex max-w-md animate-rise-in items-center gap-2.5 rounded-pill px-4 py-2.5 type-body-sm shadow-lg",
            t.tone === "error" ? "bg-danger text-ink-inverse" : "bg-surface-inverse text-ink-inverse"
          )}
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ink-inverse/12 [&_svg]:size-3.5">
            {t.tone === "error" ? <X strokeWidth={2.4} /> : <Check strokeWidth={2.4} />}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}

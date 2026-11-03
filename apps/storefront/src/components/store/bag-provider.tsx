"use client"

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/mock/catalog"

/**
 * In-memory bag for UI development.
 * Replace with the Medusa cart (sdk.store.cart.*) when the API is wired.
 */
export type BagLine = { key: string; product: Product; size: string; quantity: number }

type BagContextValue = {
  lines: BagLine[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (open: boolean) => void
  add: (product: Product, size: string, options?: { open?: boolean }) => void
  setQuantity: (key: string, quantity: number) => void
}

const BagContext = createContext<BagContextValue | null>(null)

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([])
  const [open, setOpen] = useState(false)

  const add = useCallback<BagContextValue["add"]>((product, size, options) => {
    const key = `${product.id}:${size}`
    setLines((prev) => {
      const hit = prev.find((l) => l.key === key)
      if (hit) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { key, product, size, quantity: 1 }]
    })
    if (options?.open) setOpen(true)
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l))
    )
  }, [])

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0)
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0)
    return { lines, count, subtotal, open, setOpen, add, setQuantity }
  }, [lines, open, add, setQuantity])

  return <BagContext value={value}>{children}</BagContext>
}

export function useBag() {
  const ctx = use(BagContext)
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>")
  return ctx
}

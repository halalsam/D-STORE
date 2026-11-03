"use client"

import { useCallback, useMemo } from "react"
import type { Product } from "@/lib/mock/catalog"
import { createStore, useStore } from "./create-store"

/**
 * Client bag. TODO: replace with the Medusa cart (sdk.store.cart.*);
 * keep the useBag() shape so components do not change.
 */
export type BagLine = { key: string; product: Product; size: string; quantity: number }

export const bagStore = createStore<BagLine[]>([], "dstore:bag")
const bagOpenStore = createStore(false)

export function useBag() {
  const lines = useStore(bagStore)
  const open = useStore(bagOpenStore)

  const setOpen = useCallback((o: boolean) => bagOpenStore.set(o), [])

  const add = useCallback((product: Product, size: string, options?: { open?: boolean }) => {
    const key = `${product.id}:${size}`
    bagStore.set((prev) => {
      const hit = prev.find((l) => l.key === key)
      if (hit) return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { key, product, size, quantity: 1 }]
    })
    if (options?.open) bagOpenStore.set(true)
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    bagStore.set((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity } : l))
    )
  }, [])

  const clear = useCallback(() => bagStore.set([]), [])

  return useMemo(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0)
    const subtotal = lines.reduce((n, l) => n + l.quantity * l.product.price, 0)
    return { lines, count, subtotal, open, setOpen, add, setQuantity, clear }
  }, [lines, open, setOpen, add, setQuantity, clear])
}

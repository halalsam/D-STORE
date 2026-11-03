"use client"

import { useCallback, useMemo } from "react"
import { addToBag, getBag, updateBagLine } from "@/lib/data/cart"
import { emptyBag, type Bag, type Product } from "@/lib/types"
import { toast } from "@/components/ui/toast"
import { createStore, useStore } from "./create-store"

/** Client mirror of the Medusa cart. Server actions are the source of truth. */
export const bagStore = createStore<Bag>(emptyBag)
const bagOpenStore = createStore(false)
const busyStore = createStore(false)

let synced = false
/** Load the cart once per page load (called by <BagSync />). */
export async function syncBag(force = false) {
  if (synced && !force) return
  synced = true
  bagStore.set(await getBag())
}

export function setBag(bag: Bag) {
  bagStore.set(bag)
}

export function useBag() {
  const bag = useStore(bagStore)
  const open = useStore(bagOpenStore)
  const busy = useStore(busyStore)

  const setOpen = useCallback((o: boolean) => bagOpenStore.set(o), [])

  const add = useCallback(async (product: Product, sizeLabel: string, options?: { open?: boolean; silent?: boolean }) => {
    const size = product.sizes.find((s) => s.label === sizeLabel)
    if (!size) return false
    busyStore.set(true)
    const res = await addToBag(size.variantId, 1, { tone: product.tones[0], silhouette: product.silhouette })
    busyStore.set(false)
    if (!res.ok) {
      toast(res.error, "error")
      return false
    }
    bagStore.set(res.data)
    if (options?.open) bagOpenStore.set(true)
    else if (!options?.silent) toast(`${product.title}, ${sizeLabel} added to bag`)
    return true
  }, [])

  const setQuantity = useCallback(async (key: string, quantity: number) => {
    busyStore.set(true)
    const res = await updateBagLine(key, quantity)
    busyStore.set(false)
    if (!res.ok) return toast(res.error, "error")
    bagStore.set(res.data)
  }, [])

  return useMemo(
    () => ({ bag, lines: bag.lines, count: bag.count, subtotal: bag.subtotal, open, busy, setOpen, add, setQuantity }),
    [bag, open, busy, setOpen, add, setQuantity]
  )
}

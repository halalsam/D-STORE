"use client"

import { createStore, useStore } from "./create-store"

/** Saved (bookmarked) product handles. TODO: Medusa wishlist or customer metadata. */
export const savedStore = createStore<string[]>([], "dstore:saved")

export function useSaved() {
  return useStore(savedStore)
}

export function toggleSaved(handle: string, on: boolean) {
  savedStore.set((prev) => (on ? Array.from(new Set([...prev, handle])) : prev.filter((h) => h !== handle)))
}

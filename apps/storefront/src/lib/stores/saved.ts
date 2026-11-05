"use client"

import { loadSavedItems, saveSavedItems } from "@/lib/data/customer"
import { createStore, useStore } from "./create-store"

/** Saved (bookmarked) product handles. Kept in the browser, and in customer metadata when signed in. */
export const savedStore = createStore<string[]>([], "dstore:saved")

/** Which account the browser list belongs to. Unset: a guest's list, merged into the account on sign-in. */
const OWNER_KEY = "dstore:saved-owner"

function owner() {
  try {
    return window.localStorage.getItem(OWNER_KEY)
  } catch {
    return null
  }
}

function setOwner(id: string | null) {
  try {
    if (id) window.localStorage.setItem(OWNER_KEY, id)
    else window.localStorage.removeItem(OWNER_KEY)
  } catch {
    // Storage blocked: saved items just stay local for this visit.
  }
}

export function useSaved() {
  return useStore(savedStore)
}

let pushTimer: ReturnType<typeof setTimeout> | undefined

export function toggleSaved(handle: string, on: boolean) {
  savedStore.set((prev) => (on ? Array.from(new Set([...prev, handle])) : prev.filter((h) => h !== handle)))
  if (!owner()) return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => void saveSavedItems(savedStore.get()), 400)
}

/** Call on page load and after sign-in or sign-out. */
export async function syncSaved() {
  const current = owner()
  const account = await loadSavedItems()
  if (!account) {
    // Signed out: an account's list should not linger on a shared device.
    if (current) {
      savedStore.set([])
      setOwner(null)
    }
    return
  }
  if (current === account.customerId) {
    savedStore.set(account.items)
    return
  }
  const merged = current ? account.items : Array.from(new Set([...account.items, ...savedStore.get()]))
  savedStore.set(merged)
  setOwner(account.customerId)
  if (merged.length !== account.items.length) await saveSavedItems(merged)
}

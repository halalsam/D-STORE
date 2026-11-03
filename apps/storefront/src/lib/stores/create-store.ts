"use client"

import { useSyncExternalStore } from "react"

type Updater<T> = T | ((prev: T) => T)

export type Store<T> = {
  get: () => T
  getServer: () => T
  set: (next: Updater<T>) => void
  subscribe: (listener: () => void) => () => void
}

/**
 * Tiny external store, optionally persisted to localStorage.
 * Used for client state that must survive navigation and refresh
 * (bag, saved items, mock account) until the Medusa API replaces it.
 */
export function createStore<T>(initial: T, storageKey?: string): Store<T> {
  let value = initial
  let loaded = false
  const listeners = new Set<() => void>()

  const load = () => {
    if (loaded || typeof window === "undefined") return
    loaded = true
    if (!storageKey) return
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) value = JSON.parse(raw) as T
    } catch {
      // Ignore unreadable storage (private mode, quota, bad JSON).
    }
  }

  const emit = () => listeners.forEach((l) => l())

  return {
    get: () => {
      load()
      return value
    },
    getServer: () => initial,
    set: (next) => {
      load()
      value = next instanceof Function ? next(value) : next
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(value))
        } catch {
          // Storage full or blocked: keep the in-memory value.
        }
      }
      emit()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      const onStorage = (e: StorageEvent) => {
        if (!storageKey || e.key !== storageKey) return
        try {
          value = e.newValue ? (JSON.parse(e.newValue) as T) : initial
        } catch {
          value = initial
        }
        emit()
      }
      window.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(listener)
        window.removeEventListener("storage", onStorage)
      }
    },
  }
}

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer)
}

const noop = () => () => {}

/** False during SSR and hydration, true after. Use to avoid empty-state flashes. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false)
}

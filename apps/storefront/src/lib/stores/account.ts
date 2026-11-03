"use client"

import { demoAddresses, demoCustomer, demoOrders, type Address, type Customer, type Order } from "@/lib/mock/account"
import { createStore, useStore } from "./create-store"

/**
 * Mock signed-in customer. TODO: replace with Medusa customer endpoints
 * (sdk.store.customer.*, sdk.store.order.*) behind real auth.
 */
export const customerStore = createStore<Customer>(demoCustomer, "dstore:customer")
export const addressStore = createStore<Address[]>(demoAddresses, "dstore:addresses")
/** Orders placed through the mock checkout; newest first. */
export const placedOrderStore = createStore<Order[]>([], "dstore:orders")

export const useCustomer = () => useStore(customerStore)
export const useAddresses = () => useStore(addressStore)

export function useOrders() {
  const placed = useStore(placedOrderStore)
  return [...placed, ...demoOrders]
}

export function saveAddress(address: Address) {
  addressStore.set((prev) => {
    const exists = prev.some((a) => a.id === address.id)
    let next = exists ? prev.map((a) => (a.id === address.id ? address : a)) : [...prev, address]
    if (address.isDefault || next.length === 1) {
      next = next.map((a) => ({ ...a, isDefault: a.id === address.id }))
    }
    return next
  })
}

export function removeAddress(id: string) {
  addressStore.set((prev) => {
    const next = prev.filter((a) => a.id !== id)
    if (next.length && !next.some((a) => a.isDefault)) next[0] = { ...next[0], isDefault: true }
    return next
  })
}

export function placeOrder(order: Order) {
  placedOrderStore.set((prev) => [order, ...prev])
}

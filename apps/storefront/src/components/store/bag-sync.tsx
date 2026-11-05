"use client"

import { useEffect } from "react"
import { syncBag } from "@/lib/stores/bag"
import { syncSaved } from "@/lib/stores/saved"

/** Loads the Medusa cart and the account's saved items into the client stores once per page load. */
export function BagSync() {
  useEffect(() => {
    void syncBag()
    void syncSaved()
  }, [])
  return null
}

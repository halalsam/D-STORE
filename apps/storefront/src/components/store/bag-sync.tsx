"use client"

import { useEffect } from "react"
import { syncBag } from "@/lib/stores/bag"

/** Loads the Medusa cart into the client bag store once per page load. */
export function BagSync() {
  useEffect(() => {
    void syncBag()
  }, [])
  return null
}

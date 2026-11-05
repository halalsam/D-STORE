"use client"

import { useCallback, useRef } from "react"

/**
 * Replays the shake animation on an element. Restarting it by changing a React
 * `key` remounts the children, which wipes whatever the shopper typed into
 * uncontrolled inputs, so this toggles the class on the DOM node instead.
 * Keep the element's own className constant so React never rewrites it.
 */
export function useShake<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const shake = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.classList.remove("animate-shake")
    void el.offsetWidth
    el.classList.add("animate-shake")
    el.addEventListener("animationend", () => el.classList.remove("animate-shake"), { once: true })
  }, [])
  return [ref, shake] as const
}

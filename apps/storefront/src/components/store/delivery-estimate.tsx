"use client"

import { useEffect, useRef } from "react"

/**
 * Standard delivery window from the shipping policy (help/shipping): packed
 * within 24 hours, dispatched the next business day, delivered in 3 to 5
 * business days. Business days are Monday to Saturday. Worked out in the
 * browser so the dates follow the shopper's clock, not the build's.
 */
function addBusinessDays(from: Date, days: number) {
  const d = new Date(from)
  let left = days
  while (left > 0) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0) left--
  }
  return d
}

const fmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" })

function windowFromToday() {
  const dispatch = addBusinessDays(new Date(), 1)
  return `${fmt.format(addBusinessDays(dispatch, 3))} to ${fmt.format(addBusinessDays(dispatch, 5))}`
}

export function DeliveryEstimate() {
  // The page is prerendered without a clock, so it ships the policy wording and
  // swaps in real dates once the browser runs this.
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.textContent = windowFromToday()
  }, [])
  return (
    <>
      Free delivery{" "}
      <span ref={ref} className="text-ink">
        in 3 to 5 business days
      </span>
    </>
  )
}

import { Check } from "lucide-react"
import { ProductMedia } from "@/components/store/product-media"
import { formatPrice } from "@/lib/format"
import type { Order, OrderLine, OrderStatus } from "@/lib/mock/account"
import { orderStatusLabel } from "@/lib/mock/account"
import { cn } from "@/lib/utils"

export function LineItem({ line, currency = "inr", compact = false }: { line: OrderLine; currency?: string; compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("relative aspect-[3/4] shrink-0 overflow-hidden rounded-md", compact ? "w-14" : "w-16")}>
        <ProductMedia tone={line.tone} silhouette={line.silhouette} alt={line.title} />
        {line.quantity > 1 && (
          <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-pill bg-surface-inverse px-1 text-[0.6875rem] text-ink-inverse tabular-nums">
            {line.quantity}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate type-body-sm font-medium">{line.title}</p>
        <p className="type-caption text-ink-muted">Size {line.size}{line.quantity > 1 ? ` · Qty ${line.quantity}` : ""}</p>
      </div>
      <p className="type-body-sm type-price">{formatPrice(line.unitPrice * line.quantity, currency)}</p>
    </div>
  )
}

type TotalsProps = {
  subtotal: number
  discount?: number
  shipping?: number | null
  total: number
  currency?: string
  discountLabel?: string
}

export function Totals({ subtotal, discount = 0, shipping, total, currency = "inr", discountLabel }: TotalsProps) {
  const row = "flex items-baseline justify-between type-body-sm"
  return (
    <dl className="grid gap-2">
      <div className={row}><dt className="text-ink-muted">Subtotal</dt><dd className="type-price">{formatPrice(subtotal, currency)}</dd></div>
      {discount > 0 && (
        <div className={cn(row, "animate-rise-in")}>
          <dt className="text-ink-muted">Discount{discountLabel ? ` (${discountLabel})` : ""}</dt>
          <dd className="type-price text-success">-{formatPrice(discount, currency)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-ink-muted">Shipping</dt>
        <dd className="type-price">{shipping === null || shipping === undefined ? <span className="text-ink-muted">Next step</span> : shipping === 0 ? "Free" : formatPrice(shipping, currency)}</dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="type-title">Total</dt>
        <dd className="text-right">
          <span className="block type-heading-sm type-price">{formatPrice(total, currency)}</span>
          <span className="type-caption text-ink-muted">Including GST</span>
        </dd>
      </div>
    </dl>
  )
}

const flow: OrderStatus[] = ["placed", "packed", "shipped", "delivered"]

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone =
    status === "delivered" ? "bg-success-soft text-success" : status === "cancelled" ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-soft-ink"
  return <span className={cn("inline-flex h-6 items-center rounded-xs px-2 type-caption", tone)}>{orderStatusLabel[status]}</span>
}

/** Horizontal tracker: placed, packed, shipped, delivered. */
export function OrderTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null
  const current = flow.indexOf(status)
  return (
    <ol className="relative grid grid-cols-4">
      <span aria-hidden className="absolute top-3 right-[12.5%] left-[12.5%] h-0.5 rounded-pill bg-surface-strong" />
      <span
        aria-hidden
        className="absolute top-3 left-[12.5%] h-0.5 origin-left rounded-pill bg-accent transition-transform duration-(--duration-bounce) ease-spring"
        style={{ width: "75%", transform: `scaleX(${current / (flow.length - 1)})` }}
      />
      {flow.map((s, i) => {
        const done = i <= current
        return (
          <li key={s} className="relative grid justify-items-center gap-2 text-center">
            <span
              className={cn(
                "grid size-6 place-items-center rounded-pill ring-4 ring-surface transition-colors duration-(--duration-base)",
                done ? "bg-accent text-white" : "bg-surface-strong text-ink-subtle"
              )}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-pill bg-current" />}
            </span>
            <span className={cn("type-caption", done ? "text-ink" : "text-ink-subtle")} aria-current={i === current ? "step" : undefined}>
              {orderStatusLabel[s]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function orderItemCount(order: Order) {
  return order.lines.reduce((n, l) => n + l.quantity, 0)
}

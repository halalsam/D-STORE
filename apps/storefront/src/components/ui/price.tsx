import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = {
  amount: number
  compareAt?: number
  currency?: string
  className?: string
}

export function Price({ amount, compareAt, currency = "inr", className }: Props) {
  const onSale = compareAt !== undefined && compareAt > amount
  return (
    <p className={cn("type-price", className)}>
      <span className={onSale ? "text-danger" : undefined}>{formatPrice(amount, currency)}</span>
      {onSale && (
        <>
          <span className="sr-only">, was </span>
          <s className="ml-2 text-ink-subtle">{formatPrice(compareAt, currency)}</s>
        </>
      )}
    </p>
  )
}

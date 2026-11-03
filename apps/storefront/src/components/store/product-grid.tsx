import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProductCard } from "./product-card"

type Props = {
  products: Product[]
  density?: "default" | "dense"
  /** Animate cards in with a stagger. */
  reveal?: boolean
  priorityCount?: number
  className?: string
}

export function ProductGrid({ products, density = "default", reveal = true, priorityCount = 0, className }: Props) {
  return (
    <div className={cn(density === "dense" ? "product-grid-dense" : "product-grid gap-y-6", className)}>
      {products.map((p, i) => (
        <div
          key={p.id}
          className={reveal ? "animate-rise-in" : undefined}
          style={reveal ? { animationDelay: `${Math.min(i, 12) * 45}ms` } : undefined}
        >
          <ProductCard product={p} density={density} priority={i < priorityCount} />
        </div>
      ))}
    </div>
  )
}

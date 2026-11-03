import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ProductCard } from "./product-card"

type Props = {
  products: Product[]
  density?: "default" | "dense"
  /** Animate cards in with a stagger. */
  reveal?: boolean
  priorityCount?: number
  /** "rail": swipeable row on phones with a peek of the next card, grid from md. */
  layout?: "grid" | "rail"
  className?: string
}

export function ProductGrid({ products, density = "default", reveal = true, priorityCount = 0, layout = "grid", className }: Props) {
  const rail = layout === "rail" && density === "default"
  return (
    <div
      className={cn(
        rail
          ? "product-rail md:grid md:grid-cols-3 md:gap-tile md:gap-y-6 lg:grid-cols-4"
          : density === "dense"
            ? "product-grid-dense"
            : "product-grid gap-y-6",
        className
      )}
    >
      {products.map((p, i) => (
        <div
          key={p.id}
          className={cn(rail && "product-rail-item", reveal && "animate-rise-in")}
          style={reveal ? { animationDelay: `${Math.min(i, 12) * 45}ms` } : undefined}
        >
          <ProductCard product={p} density={density} priority={i < priorityCount} />
        </div>
      ))}
    </div>
  )
}

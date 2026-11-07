"use client"

import { Popover } from "radix-ui"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingBagAdd } from "@/components/ui/icons"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useBag } from "@/lib/stores/bag"

type Props = {
  product: Product
  /** "inline": small + beside the card's price. "media": round bag button over a photo. */
  appearance?: "inline" | "media"
  className?: string
}

/** Adds a one-size product straight away; otherwise opens a size picker. */
export function QuickAdd({ product, appearance = "inline", className }: Props) {
  const { add } = useBag()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)
  const single = product.sizes.length === 1
  const media = appearance === "media"

  const button = {
    variant: media ? ("media" as const) : ("ghost" as const),
    size: media ? ("icon-lg" as const) : ("icon-sm" as const),
    className: cn(media ? "data-[state=open]:bg-surface-inverse-hover" : "-mr-1.5", className),
  }
  const icon = media ? (
    <ShoppingBagAdd strokeWidth={1.6} className="size-5!" />
  ) : (
    <Plus strokeWidth={1.4} className={cn("size-5!", !single && "transition-transform duration-(--duration-spring) ease-spring")} />
  )

  if (single) {
    return (
      <Button
        {...button}
        aria-label={`Add ${product.title} to bag`}
        loading={pending !== null}
        onClick={async () => {
          setPending(product.sizes[0].label)
          await add(product, product.sizes[0].label)
          setPending(null)
        }}
      >
        {icon}
      </Button>
    )
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button
          {...button}
          aria-label={`Quick add ${product.title}`}
          className={cn(button.className, !media && "data-[state=open]:bg-surface-muted [&[data-state=open]_svg]:rotate-45")}
        >
          {icon}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            "w-60 origin-(--radix-popover-content-transform-origin) rounded-xl bg-surface p-2 shadow-lg ring-1 ring-line data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
            // Over the full-screen lightbox, which sits on the drawer layer.
            media ? "z-(--z-toast)" : "z-(--z-overlay)"
          )}
        >
          <p className="px-1.5 pt-0.5 pb-2 type-overline text-ink-muted">Select size</p>
          <div className="grid grid-cols-4 gap-1">
            {product.sizes.map((s) => (
              <button
                key={s.label}
                disabled={!s.available || pending !== null}
                onClick={async () => {
                  setPending(s.label)
                  const ok = await add(product, s.label)
                  setPending(null)
                  if (ok) setOpen(false)
                }}
                className="pressable relative h-9 rounded-pill bg-surface-muted type-caption hover:bg-surface-inverse hover:text-ink-inverse disabled:bg-transparent disabled:text-ink-subtle disabled:line-through"
              >
                <span className={pending === s.label ? "invisible" : undefined}>{s.label}</span>
                {pending === s.label && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

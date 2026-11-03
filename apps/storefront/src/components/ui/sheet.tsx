"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { Dialog } from "radix-ui"
import { X } from "@/components/ui/icons"
import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export const Sheet = Dialog.Root
export const SheetTrigger = Dialog.Trigger
export const SheetClose = Dialog.Close

const contentVariants = cva(
  "fixed z-(--z-drawer) flex flex-col overflow-hidden bg-canvas text-ink shadow-lg outline-none",
  {
    variants: {
      side: {
        /** Filters, bag. Floats with a small inset like an iPad sheet. */
        right:
          "inset-y-2 right-2 w-[min(28rem,calc(100vw-1rem))] rounded-xl data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out",
        /** Bottom sheet on phones, right drawer from md (filters). */
        responsive: [
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-sheet pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          "md:inset-x-auto md:inset-y-2 md:right-2 md:bottom-2 md:max-h-none md:w-[min(28rem,calc(100vw-1rem))] md:rounded-xl md:pb-0",
          "md:data-[state=open]:animate-drawer-in md:data-[state=closed]:animate-drawer-out",
        ],
        /** Mobile actions. */
        bottom:
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-sheet pb-[env(safe-area-inset-bottom)] data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
        /** Bottom sheet on phones, centred card from md up (size guide, zoom). */
        adaptive: [
          "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-sheet data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out",
          "md:inset-0 md:m-auto md:h-fit md:max-h-[calc(100dvh-4rem)] md:w-[min(40rem,calc(100vw-4rem))] md:rounded-2xl",
          "md:data-[state=open]:animate-scale-in md:data-[state=closed]:animate-scale-out",
        ],
      },
    },
    defaultVariants: { side: "right" },
  }
)

type ContentProps = Omit<ComponentProps<typeof Dialog.Content>, "title"> &
  VariantProps<typeof contentVariants> & {
    title: string
    /** Shown under the title, e.g. "25 products". */
    subtitle?: string
    /** Sticky bottom action row. */
    footer?: ReactNode
    bodyClassName?: string
  }

export function SheetContent({
  side,
  title,
  subtitle,
  footer,
  children,
  className,
  bodyClassName,
  ...props
}: ContentProps) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-scrim data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <Dialog.Content
        aria-describedby={undefined}
        className={cn(contentVariants({ side }), className)}
        {...props}
      >
        {(side === "bottom" || side === "adaptive" || side === "responsive") && (
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-pill bg-line-strong md:hidden" />
        )}
        <header className="relative grid shrink-0 place-items-center border-b border-line px-14 py-4 text-center">
          <Dialog.Title className="type-label">{title}</Dialog.Title>
          {subtitle && <p className="mt-1 type-overline text-ink-muted">{subtitle}</p>}
          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-1/2 right-3 -translate-y-1/2">
              <X strokeWidth={1.5} />
            </Button>
          </Dialog.Close>
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>{children}</div>
        {footer && <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-3">{footer}</footer>}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

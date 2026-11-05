"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { createPortal } from "react-dom"

const noop = () => () => {}
const useIsClient = () => useSyncExternalStore(noop, () => true, () => false)

/**
 * The step's main action: inline under the form from lg, docked to the bottom
 * on phones with the total beside it. The docked copy is portalled because the
 * step slides in with a transform, which would pin `fixed` to the step.
 */
export function ActionBar({ total, children }: { total: string; children: ReactNode }) {
  const isClient = useIsClient()
  return (
    <>
      <div className="mt-8 hidden lg:block">{children}</div>
      {isClient &&
        createPortal(
          <div className="fixed inset-x-0 bottom-0 z-(--z-header) border-t border-line bg-surface/90 px-gutter pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] material lg:hidden">
            <div className="mx-auto flex max-w-xl items-center gap-4">
              <div className="shrink-0">
                <p className="type-caption text-ink-muted">Total</p>
                <p className="type-heading-sm type-price">{total}</p>
              </div>
              <div className="min-w-0 flex-1 [&_button]:w-full">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

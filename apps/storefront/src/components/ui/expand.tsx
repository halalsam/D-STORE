import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/** Animated height reveal (grid-rows 0fr to 1fr) on the iOS curve. */
export function Expand({ open, children, className }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-(--duration-sheet) ease-ios",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

"use client"

import { Switch as SwitchPrimitive } from "radix-ui"
import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = ComponentProps<typeof SwitchPrimitive.Root> & {
  label: ReactNode
  description?: ReactNode
}

/** iOS toggle. The thumb travels on the default spring. */
export function Switch({ label, description, className, id, ...props }: Props) {
  const autoId = useId()
  const switchId = id ?? autoId
  return (
    <div className={cn("flex items-center justify-between gap-6", className)}>
      <label htmlFor={switchId} className="min-w-0">
        <span className="block type-body text-ink">{label}</span>
        {description && <span className="mt-0.5 block type-caption text-ink-muted">{description}</span>}
      </label>
      <SwitchPrimitive.Root
        id={switchId}
        className={cn(
          "pressable relative h-[1.9rem] w-[3.1rem] shrink-0 rounded-full bg-surface-strong p-0.5",
          "transition-colors duration-(--duration-base) ease-standard data-[state=checked]:bg-accent"
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block size-[1.65rem] rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.35)]",
            "transition-transform duration-(--duration-spring) ease-spring data-[state=checked]:translate-x-[1.2rem]"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  )
}

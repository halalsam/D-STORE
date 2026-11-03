"use client"

import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check } from "lucide-react"
import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = ComponentProps<typeof CheckboxPrimitive.Root> & { label: ReactNode }

/** Round teal checkbox with a springy check. */
export function Checkbox({ label, className, id, ...props }: Props) {
  const autoId = useId()
  const boxId = id ?? autoId
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <CheckboxPrimitive.Root
        id={boxId}
        className={cn(
          "pressable grid size-5 shrink-0 place-items-center rounded-pill bg-surface ring-1 ring-line-strong ring-inset",
          "data-[state=checked]:bg-accent data-[state=checked]:ring-transparent"
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator className="animate-pop text-white">
          <Check className="size-3" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <label htmlFor={boxId} className="type-body-sm text-ink">
        {label}
      </label>
    </div>
  )
}

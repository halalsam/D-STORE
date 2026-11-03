import { useId, type ComponentProps, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = ComponentProps<"input"> & {
  label: string
  /** Keep the label for screen readers only (placeholder carries it visually). */
  hideLabel?: boolean
  hint?: string
  error?: string
  leading?: ReactNode
  /** Element inside the right edge, e.g. a submit arrow IconButton. */
  trailing?: ReactNode
  fieldClassName?: string
}

export function TextField({
  label,
  hideLabel = false,
  hint,
  error,
  leading,
  trailing,
  className,
  fieldClassName,
  id,
  ...props
}: Props) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={inputId} className={hideLabel ? "sr-only" : "type-body-sm text-ink"}>
        {label}
      </label>
      <div
        className={cn(
          "group/field flex h-12 items-center gap-2 rounded-md bg-surface px-4 ring-1 ring-line-strong ring-inset",
          "transition-[box-shadow,background-color] duration-(--duration-fast) ease-standard",
          "focus-within:ring-2 focus-within:ring-accent",
          error && "ring-danger focus-within:ring-danger",
          trailing && "pr-1.5",
          fieldClassName
        )}
      >
        {leading && <span className="text-ink-muted [&_svg]:size-[1.15rem]">{leading}</span>}
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent type-body text-ink outline-none"
          {...props}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="animate-rise-in type-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="type-caption text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

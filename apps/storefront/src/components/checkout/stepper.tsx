import { Check } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export type StepperStep<T extends string> = { id: T; label: string }

type Props<T extends string> = {
  steps: StepperStep<T>[]
  current: T
  /** Finished steps become buttons that jump back. */
  onJump?: (step: T) => void
}

/** Horizontal checkout progress: a filled track per step, label underneath. */
export function Stepper<T extends string>({ steps, current, onJump }: Props<T>) {
  const index = Math.max(0, steps.findIndex((s) => s.id === current))
  return (
    <nav aria-label="Checkout progress">
      <ol className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, i) => {
          const done = i < index
          const active = i === index
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!done || !onJump}
                onClick={() => onJump?.(step.id)}
                aria-current={active ? "step" : undefined}
                className="group block w-full text-left disabled:cursor-default"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-line">
                  <span
                    className={cn(
                      "block h-full origin-left rounded-pill bg-surface-inverse transition-transform duration-(--duration-spring) ease-spring",
                      done || active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "mt-2 flex items-center gap-1.5 truncate type-caption transition-colors",
                    active ? "font-medium text-ink" : done ? "text-ink-muted group-hover:text-ink" : "text-ink-subtle"
                  )}
                >
                  {done && <Check className="size-3 shrink-0 text-accent-ink" strokeWidth={2.4} />}
                  <span className="truncate">{step.label}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

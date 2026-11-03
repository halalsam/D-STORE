import { Check } from "@/components/ui/icons"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Expand } from "@/components/ui/expand"
import { cn } from "@/lib/utils"

type Props = {
  index: number
  title: string
  state: "active" | "done" | "upcoming"
  summary?: ReactNode
  onEdit?: () => void
  children: ReactNode
}

/** One checkout step. Active expands, done collapses to a summary, upcoming is dimmed. */
export function StepCard({ index, title, state, summary, onEdit, children }: Props) {
  const active = state === "active"
  const done = state === "done"
  return (
    <section
      aria-current={active ? "step" : undefined}
      className={cn(
        "rounded-panel bg-surface transition-[opacity,box-shadow] duration-(--duration-base)",
        active ? "shadow-md" : "",
        state === "upcoming" && "opacity-55"
      )}
    >
      <header className="flex items-center gap-3 px-5 pt-5 pb-5 md:px-7">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-pill type-caption font-medium tabular-nums transition-colors duration-(--duration-base)",
            done ? "bg-accent text-white" : active ? "bg-surface-inverse text-ink-inverse" : "bg-surface-muted text-ink-muted"
          )}
        >
          {done ? <Check key="check" className="size-3.5 animate-pop" strokeWidth={3} /> : index}
        </span>
        <h2 className="flex-1 type-heading-sm">{title}</h2>
        {done && onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-accent-ink">Edit</Button>
        )}
      </header>
      <Expand open={done && !!summary}>
        <div className="px-5 pb-5 pl-[3.75rem] md:px-7 md:pl-[4.25rem]">{summary}</div>
      </Expand>
      <Expand open={active}>
        <div className="px-5 pb-6 md:px-7 md:pb-7">{children}</div>
      </Expand>
    </section>
  )
}

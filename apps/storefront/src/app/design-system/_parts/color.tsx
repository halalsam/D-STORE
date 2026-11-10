import { anchors, baseSwatches, ramps, semantic, steps } from "./data"
import { contrast, grade } from "./contrast"

export function ColorPalette() {
  return (
    <div className="grid gap-tile">
      {/* Base palette: in the style of the brand palette card */}
      <div className="grid grid-cols-2 gap-tile md:grid-cols-5">
        {baseSwatches.map((s, i) => (
          <div
            key={s.name}
            style={{ backgroundColor: s.hex, color: s.ink, animationDelay: `${i * 45}ms` }}
            className={
              "relative flex aspect-card animate-rise-in flex-col justify-end overflow-hidden rounded-card p-5 " +
              (s.hex === "#FFFFFF" || s.hex === "#F5EFEB" ? "hairline" : "")
            }
          >
            <span className="absolute top-5 left-5 rotate-180 type-overline tracking-[0.18em] opacity-80 [writing-mode:vertical-rl]">
              {s.hex}
            </span>
            <p className="type-heading-lg">{s.name}</p>
            <p className="mt-1 type-overline opacity-80">{s.role}</p>
          </div>
        ))}
      </div>

      {/* Tonal ramps */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="type-heading-sm">Tonal ramps</h3>
          <p className="type-caption text-ink-muted">Ring marks the brand swatch</p>
        </div>
        <div className="grid gap-4">
          {(Object.keys(ramps) as (keyof typeof ramps)[]).map((name) => (
            <div key={name} className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
              <p className="type-label text-ink-muted">{name}</p>
              <div className="grid grid-cols-11 gap-1">
                {ramps[name].map((hex, i) => {
                  const step = steps[i]
                  const isAnchor = anchors[name] === step
                  return (
                    <div key={step} className="grid gap-1.5">
                      <div
                        style={{ backgroundColor: hex }}
                        className={
                          "h-12 rounded-sm md:h-14 " +
                          (isAnchor ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : "")
                        }
                        title={`${name}-${step} ${hex}`}
                      />
                      <p className="hidden text-center type-caption tabular-nums text-ink-muted md:block">
                        {step}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Semantic tokens */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="type-heading-sm">Semantic tokens</h3>
          <p className="type-caption text-ink-muted">Components only use these</p>
        </div>
        <div className="grid gap-x-8 md:grid-cols-2 xl:grid-cols-3">
          {semantic.map((t) => {
            const onCanvas = contrast(t.hex, "#F5EFEB")
            const isText = t.group !== "Surface"
            return (
              <div key={t.token} className="flex items-center gap-4 border-b border-line py-3.5">
                <div style={{ backgroundColor: t.hex }} className="size-11 shrink-0 rounded-md hairline" />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[0.8125rem] text-ink">{t.token}</p>
                  <p className="truncate type-caption text-ink-muted">{t.use}</p>
                </div>
                <div className="text-right">
                  <p className="type-caption text-ink-muted">{t.maps}</p>
                  {isText && (
                    <p className="type-caption tabular-nums text-ink">
                      {onCanvas.toFixed(1)}:1 <span className="text-ink-muted">{grade(onCanvas)}</span>
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { radii, shadows } from "./data"

export function ShapeAndDepth() {
  return (
    <div className="grid gap-grid">
      <div className="grid gap-grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* Radius scale */}
        <div className="panel">
          <h3 className="mb-5 type-heading-sm">Radius</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {radii.map((r) => (
              <div key={r.token} className="grid gap-2">
                <div className="grid aspect-square place-items-center rounded-lg bg-canvas">
                  <div
                    style={{ borderRadius: r.px }}
                    className="squircle size-3/5 bg-sky-200 ring-1 ring-line-strong ring-inset"
                  />
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="font-mono text-[0.75rem]">{r.token}</p>
                  <p className="type-caption tabular-nums text-ink-muted">{r.px === 999 ? "full" : `${r.px}px`}</p>
                </div>
                <p className="-mt-1 type-caption text-ink-subtle">{r.use}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Concentric rule */}
        <div className="panel flex flex-col">
          <h3 className="type-heading-sm">Concentric corners</h3>
          <p className="mt-1 type-body-sm text-ink-muted">
            Inner radius = outer radius minus the padding between them. This is
            what makes nested shapes read like iOS.
          </p>
          <div className="mt-6 grid flex-1 place-items-center">
            <div className="w-full max-w-xs rounded-panel bg-canvas p-3.5">
              <div className="rounded-[calc(var(--radius-panel)-0.875rem)] bg-surface p-2.5 shadow-sm">
                <div className="aspect-[4/3] rounded-[calc(var(--radius-panel)-1.5rem)] bg-sky-200" />
                <div className="mt-2.5 flex gap-2">
                  <div className="h-10 flex-1 rounded-pill bg-surface-muted" />
                  <div className="h-10 flex-1 rounded-pill bg-surface-inverse" />
                </div>
              </div>
            </div>
            <p className="mt-4 font-mono text-[0.6875rem] text-ink-muted">32 / pad 14 → 18 / pad 10 → 8</p>
          </div>
        </div>
      </div>

      {/* Elevation + material */}
      <div className="grid gap-grid lg:grid-cols-2">
        <div className="panel">
          <h3 className="mb-5 type-heading-sm">Elevation</h3>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-canvas p-5 sm:grid-cols-5">
            {shadows.map((s) => (
              <div key={s.token} className="grid gap-2 text-center">
                <div style={{ boxShadow: `var(--shadow-${s.token})` }} className="aspect-square rounded-lg bg-surface" />
                <p className="font-mono text-[0.75rem]">{s.token}</p>
                <p className="-mt-1.5 type-caption text-ink-subtle">{s.use}</p>
              </div>
            ))}
          </div>
        </div>
        <div
          className="relative min-h-72 overflow-hidden rounded-panel p-6"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 10%, var(--color-sky-300), transparent 60%), radial-gradient(90% 80% at 90% 90%, var(--color-teal-500), transparent 60%), var(--color-navy-800)",
          }}
        >
          <p className="type-overline text-ink-on-media/80">Material</p>
          <div className="absolute inset-x-6 top-16 flex h-14 items-center justify-between rounded-pill material px-5 shadow-glass">
            <span className="type-body-sm font-medium">material</span>
            <span className="type-caption text-ink-muted">header over imagery</span>
          </div>
          <div className="absolute inset-x-6 bottom-6 flex h-14 items-center justify-between rounded-pill material-dark px-5 text-ink-on-media shadow-glass">
            <span className="type-body-sm font-medium">material-dark</span>
            <span className="type-caption opacity-75">chips on photos</span>
          </div>
        </div>
      </div>
    </div>
  )
}

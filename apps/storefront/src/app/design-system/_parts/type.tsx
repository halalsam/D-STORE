import { typeRoles } from "./data"

export function TypeSpecimen() {
  return (
    <div className="grid gap-tile lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Pairing card */}
      <div className="relative flex min-h-[28rem] flex-col justify-between overflow-hidden rounded-panel bg-surface-tint p-7 text-ink md:p-10">
        <p className="type-caption text-accent-ink">
          <span className="font-display font-bold text-ink">Amulya</span> Bold
          <span className="mx-2 opacity-60">+</span>
          <span className="font-medium text-ink">Synonym</span> Regular
        </p>
        <div>
          <p className="type-display-lg text-ink">Streetwear that keeps its cool</p>
          <p className="mt-6 max-w-md type-body-lg text-ink-muted">
            Heavyweight cotton, washed for a lived-in hand, cut boxy through the
            shoulder. Amulya carries the voice, Synonym does the reading.
          </p>
        </div>
        <div className="flex items-end justify-between">
          <p className="font-display text-[7rem] leading-[0.75] font-bold tracking-[-0.05em] text-accent/60">Aa</p>
          <p className="font-sans text-[7rem] leading-[0.75] text-ink/20">Aa</p>
        </div>
      </div>

      {/* Scale */}
      <div className="panel">
        <ul className="divide-y divide-line">
          {typeRoles.map((r) => (
            <li key={r.cls} className="grid gap-2 py-4 first:pt-0 last:pb-0 md:grid-cols-[9rem_1fr] md:items-baseline md:gap-6">
              <div>
                <p className="type-label text-ink">{r.name}</p>
                <p className="mt-1 font-mono text-[0.6875rem] text-ink-muted">{r.cls}</p>
              </div>
              <div className="min-w-0">
                <p className={`${r.cls} break-words`}>{r.sample}</p>
                <p className="mt-1 type-caption text-ink-subtle">{r.spec}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

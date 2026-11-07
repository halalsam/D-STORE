"use client"

import { useState } from "react"
import { Plus, RotateCcw, ShoppingBag } from "@/components/ui/icons"

const springPoints = {
  spring: "0, 0.019, 0.0682, 0.1377, 0.2195, 0.3073, 0.3964, 0.4832, 0.5651, 0.6406, 0.7086, 0.7688, 0.821, 0.8656, 0.903, 0.9338, 0.9586, 0.9782, 0.9933, 1.0046, 1.0127, 1.0181, 1.0214, 1.023, 1.0234, 1.0228, 1.0216, 1.0199, 1.0179, 1.0159, 1.0138, 1.0118, 1.0099, 1.0081, 1.0066, 1.0052, 1.004, 1.003, 1.0021, 1.0014, 1",
  snappy: "0, 0.0214, 0.0754, 0.1498, 0.2351, 0.3246, 0.4134, 0.498, 0.5764, 0.6474, 0.7104, 0.7654, 0.8127, 0.8527, 0.8862, 0.9138, 0.9363, 0.9543, 0.9685, 0.9796, 0.988, 0.9943, 0.9988, 1.002, 1.0041, 1.0054, 1.0061, 1.0063, 1.0062, 1.0059, 1.0054, 1.0049, 1.0043, 1.0037, 1.0032, 1.0027, 1.0023, 1.0019, 1.0015, 1.0012, 1",
  bounce: "0, 0.0633, 0.2198, 0.4231, 0.635, 0.8276, 0.9836, 1.0952, 1.1622, 1.19, 1.1868, 1.1622, 1.1255, 1.0847, 1.0459, 1.0132, 0.9885, 0.9726, 0.9647, 0.9634, 0.9668, 0.9732, 0.9809, 0.9886, 0.9953, 1.0007, 1.0043, 1.0064, 1.0071, 1.0067, 1.0056, 1.0042, 1.0027, 1.0013, 1.0002, 0.9994, 0.9989, 0.9987, 0.9987, 0.9988, 1",
}

function bezier(x1: number, y1: number, x2: number, y2: number, n = 40) {
  const pts: number[][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([
      3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t,
      3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t,
    ])
  }
  return pts
}

function linearPts(s: string) {
  const v = s.split(",").map(Number)
  return v.map((y, i) => [i / (v.length - 1), y])
}

const curves = [
  { name: "standard", ease: "var(--ease-standard)", ms: 280, use: "Color, opacity, small state", pts: bezier(0.2, 0, 0, 1) },
  { name: "ios", ease: "var(--ease-ios)", ms: 520, use: "Sheets, drawers, menus", pts: bezier(0.32, 0.72, 0, 1) },
  { name: "spring", ease: "var(--ease-spring)", ms: 600, use: "Press release, indicators", pts: linearPts(springPoints.spring) },
  { name: "spring-snappy", ease: "var(--ease-spring-snappy)", ms: 450, use: "Popovers, tooltips", pts: linearPts(springPoints.snappy) },
  { name: "spring-bounce", ease: "var(--ease-spring-bounce)", ms: 900, use: "Confirmations only", pts: linearPts(springPoints.bounce) },
]

function Curve({ pts }: { pts: number[][] }) {
  const W = 120
  const H = 80
  const d = pts
    .map(([x, y], i) => `${i ? "L" : "M"}${(x * W).toFixed(1)},${(H - 10 - y * (H - 24)).toFixed(1)}`)
    .join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-full" aria-hidden>
      <line x1="0" x2={W} y1={H - 10} y2={H - 10} className="stroke-line" />
      <line x1="0" x2={W} y1="14" y2="14" strokeDasharray="2 3" className="stroke-line-strong" />
      <path d={d} fill="none" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const tabs = ["Details & Description", "Washcare", "Shipping"]
const sizes = ["XS", "S", "M", "L", "XL"]

export function MotionLab() {
  const [race, setRace] = useState(false)
  const [tab, setTab] = useState(2)
  const [size, setSize] = useState(2)
  const [bag, setBag] = useState(0)
  const [reveal, setReveal] = useState(0)
  const [menu, setMenu] = useState<"idle" | "open" | "closed">("idle")

  return (
    <div className="grid gap-tile">
      {/* Curves + race */}
      <div className="panel">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="type-heading-sm">Easing</h3>
            <p className="type-caption text-ink-muted">Dashed line is the target. Springs overshoot it slightly, like iOS.</p>
          </div>
          <button
            onClick={() => setRace((r) => !r)}
            className="pressable inline-flex h-10 shrink-0 items-center gap-2 rounded-pill bg-surface-inverse px-5 type-label text-ink-inverse"
          >
            <RotateCcw className="size-4" strokeWidth={1.8} /> Play
          </button>
        </div>
        <div className="grid gap-3">
          {curves.map((c) => (
            <div key={c.name} className="grid grid-cols-[6.5rem_1fr] items-center gap-4 md:grid-cols-[8rem_7.5rem_1fr]">
              <div>
                <p className="font-mono text-[0.75rem]">{c.name}</p>
                <p className="type-caption text-ink-subtle">{c.ms}ms</p>
              </div>
              <div className="hidden md:block"><Curve pts={c.pts} /></div>
              <div className="relative h-12 rounded-pill bg-canvas">
                <div className="absolute inset-y-1 right-11 left-1">
                  <div
                    className="h-full w-full"
                    style={{
                      transform: race ? "translateX(100%)" : "translateX(0)",
                      transition: `transform ${c.ms}ms ${c.ease}`,
                    }}
                  >
                    <div className="size-10 rounded-full bg-surface-inverse shadow-sm" />
                  </div>
                </div>
                <p className="pointer-events-none absolute top-1/2 right-14 hidden -translate-y-1/2 type-caption text-ink-subtle lg:block">{c.use}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-tile lg:grid-cols-2">
        {/* Press */}
        <div className="panel">
          <h3 className="type-heading-sm">Press</h3>
          <p className="type-caption text-ink-muted">
            Hold any control. Shrinks to 96% in 90ms, springs back on release.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="pressable h-14 rounded-pill bg-surface hairline type-label">Add to bag</button>
            <button className="pressable h-14 rounded-pill bg-surface-inverse type-label text-ink-inverse">Buy now</button>
          </div>
          <div className="mt-2 flex gap-2">
            <button className="pressable h-9 rounded-pill bg-surface-muted px-4 type-body-sm">Shirts</button>
            <button className="pressable h-9 rounded-pill bg-accent-soft px-4 type-body-sm">Selected</button>
            <button aria-label="Quick add" className="pressable ml-auto grid size-9 place-items-center rounded-full hover:bg-surface-muted">
              <Plus className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Indicators */}
        <div className="panel">
          <h3 className="type-heading-sm">Indicators</h3>
          <p className="type-caption text-ink-muted">Selection slides on the default spring instead of jumping.</p>
          <div className="relative mt-6 grid grid-cols-3 border-b border-line">
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={"h-11 truncate px-2 type-body-sm transition-colors duration-200 " + (tab === i ? "text-ink font-medium" : "text-ink-muted")}
              >
                {t}
              </button>
            ))}
            <span
              className="absolute -bottom-px left-0 h-0.5 w-1/3 rounded-full bg-ink transition-transform duration-(--duration-spring) ease-spring"
              style={{ transform: `translateX(${tab * 100}%)` }}
            />
          </div>
          <div className="relative mt-5 grid grid-cols-5 rounded-pill bg-surface-muted p-1">
            <span
              className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-pill bg-surface-inverse shadow-sm transition-transform duration-(--duration-spring) ease-spring"
              style={{ transform: `translateX(${size * 100}%)` }}
            />
            {sizes.map((s, i) => (
              <button
                key={s}
                onClick={() => setSize(i)}
                className={"pressable relative h-10 rounded-pill type-label transition-colors duration-300 " + (size === i ? "text-ink-inverse" : "text-ink")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Reveal */}
        <div className="panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="type-heading-sm">Reveal</h3>
              <p className="type-caption text-ink-muted">Cards rise in on a spring, 45ms stagger.</p>
            </div>
            <button
              onClick={() => setReveal((r) => r + 1)}
              className="pressable h-9 shrink-0 rounded-pill bg-surface-muted px-4 type-body-sm"
            >
              Replay
            </button>
          </div>
          <div key={reveal} className="mt-5 grid grid-cols-4 gap-tile">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-rise-in" style={{ animationDelay: `${i * 45}ms` }}>
                <div className="aspect-card rounded-card bg-surface-strong" />
                <div className="mt-2 h-2 w-3/4 rounded-pill bg-surface-muted" />
                <div className="mt-1.5 h-2 w-1/3 rounded-pill bg-surface-muted" />
              </div>
            ))}
          </div>
        </div>

        {/* Overlay + confirm */}
        <div className="panel">
          <h3 className="type-heading-sm">Overlays and confirmation</h3>
          <p className="type-caption text-ink-muted">Menus drop on a spring and leave fast. The bag badge pops.</p>
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setMenu((m) => (m === "open" ? "closed" : "open"))}
              className="pressable h-10 rounded-pill bg-surface-muted px-5 type-body-sm"
            >
              {menu === "open" ? "Close menu" : "Open menu"}
            </button>
            <button
              onClick={() => setBag((b) => b + 1)}
              className="pressable ml-auto inline-flex h-10 items-center gap-2 rounded-pill bg-surface-inverse px-5 type-label text-ink-inverse"
            >
              Add <span className="relative"><ShoppingBag className="size-4" strokeWidth={1.8} />
                {bag > 0 && (
                  <span key={bag} className="absolute -top-2 -right-2.5 grid size-4 animate-pop place-items-center rounded-full bg-accent-soft text-[0.625rem] font-semibold text-ink">
                    {bag}
                  </span>
                )}
              </span>
            </button>
          </div>
          <div className="relative mt-3 h-36">
            <div
              aria-hidden={menu !== "open"}
              className={
                "absolute inset-x-0 top-0 origin-top rounded-2xl bg-canvas p-5 " +
                (menu === "open" ? "animate-menu-in" : menu === "closed" ? "pointer-events-none animate-menu-out" : "pointer-events-none opacity-0")
              }
            >
              <p className="type-title">Top</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["T-Shirts", "Polos", "Shirts", "Sweatshirts", "Hoodies", "Jackets"].map((c, i) => (
                  <span
                    key={c}
                    className={"rounded-pill bg-surface px-3.5 py-1.5 type-body-sm " + (menu === "open" ? "animate-rise-in" : "")}
                    style={{ animationDelay: `${60 + i * 30}ms` }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { ColorPalette } from "./_parts/color"
import { DsHeader } from "./_parts/ds-header"
import { LayoutBlueprint } from "./_parts/layout-blueprint"
import { MotionLab } from "./_parts/motion-lab"
import { DsSection } from "./_parts/section"
import { ShapeAndDepth } from "./_parts/shape"
import { TypeSpecimen } from "./_parts/type"

export const metadata: Metadata = {
  title: "Design System",
}

const toc = [
  ["colour", "Colour"],
  ["type", "Type"],
  ["shape", "Shape"],
  ["motion", "Motion"],
  ["layout", "Layout"],
  ["rules", "Rules"],
] as const

const rules = [
  ["Black becomes navy", "Anywhere the reference uses black (selected size, Buy now, Discover more), use surface-inverse."],
  ["Grey becomes mist", "The page sheet is canvas, chips are surface-muted. Neutrals come from the navy-tinted mist ramp, never warm beige."],
  ["Teal is a signal", "Focus, active lines and links. Not a fill for large areas, and small teal text uses accent-ink."],
  ["Pills for actions", "Every button and chip is rounded-pill. Rectangles are reserved for media and containers."],
  ["Concentric corners", "Nested radius = outer minus padding. A card in a panel never has a larger radius than the panel."],
  ["Press, then spring", "Interactive elements get pressable. Overlays use the ios curve. Bounce only confirms an action."],
  ["Type roles only", "Use type-* utilities. Amulya for display, headings, titles. Synonym for everything you read."],
  ["Photography leads", "UI stays quiet: hairlines, no heavy shadows, generous gutters, an 8px grid gap between cards."],
] as const

export default function DesignSystemPage() {
  return (
    <div className="min-h-dvh bg-surface">
      {/* Hero: header sits over the media, then the sheet slides over it */}
      <div className="relative isolate overflow-hidden bg-surface-inverse text-ink-on-media">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_85%_10%,color-mix(in_oklab,var(--color-teal-500)_70%,transparent),transparent_70%),radial-gradient(60%_70%_at_10%_100%,color-mix(in_oklab,var(--color-sky-300)_35%,transparent),transparent_70%)]" />
        <div className="sticky top-0"><DsHeader overMedia /></div>
        <div className="page-x pt-[10vh] pb-[calc(var(--radius-sheet)+4rem)]">
          <p className="animate-rise-in type-overline text-sky-200">MotionFit / Foundations v1</p>
          <h1 className="mt-5 max-w-[11ch] animate-rise-in type-display-2xl [animation-delay:60ms]">
            Design system
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
            <p className="max-w-md animate-rise-in type-body-lg text-sky-100 [animation-delay:120ms]">
              Tokens, type, shape and motion for the storefront. Navy, teal, sky
              and mist, Amulya over Synonym, rounded like iOS and moving like it too.
            </p>
            <nav className="flex animate-rise-in flex-wrap gap-2 [animation-delay:180ms]">
              {toc.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="pressable rounded-pill material-dark px-4 py-2 type-body-sm shadow-glass">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <main className="sheet sheet-overlap pb-section">
        <DsSection id="colour" index="01" title="Colour" kicker="Five brand swatches, four tonal ramps, one semantic layer on top.">
          <ColorPalette />
        </DsSection>
        <DsSection id="type" index="02" title="Typography" kicker="Amulya Bold for the voice. Synonym Regular for reading.">
          <TypeSpecimen />
        </DsSection>
        <DsSection id="shape" index="03" title="Shape and depth" kicker="Generous, concentric radii. Flat by default, glass over imagery.">
          <ShapeAndDepth />
        </DsSection>
        <DsSection id="motion" index="04" title="Motion" kicker="Fast press, spring release. Try every control below.">
          <MotionLab />
        </DsSection>
        <DsSection id="layout" index="05" title="Layout" kicker="Header, sheet, panel and grid structure from the reference.">
          <LayoutBlueprint />
        </DsSection>
        <DsSection id="rules" index="06" title="Rules" kicker="What keeps it consistent when components arrive.">
          <div className="grid gap-tile sm:grid-cols-2 xl:grid-cols-4">
            {rules.map(([title, body], i) => (
              <div key={title} className="panel">
                <p className="type-overline text-accent-ink tabular-nums">{String(i + 1).padStart(2, "0")}</p>
                <p className="mt-3 type-heading-sm">{title}</p>
                <p className="mt-2 type-body-sm text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </DsSection>
      </main>
    </div>
  )
}

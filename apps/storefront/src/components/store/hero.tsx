import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type Props = {
  kicker?: string
  title: string
  cta: { label: string; href: string }
  src?: string
  alt?: string
}

/**
 * Full-bleed campaign hero. Sits under the transparent header (pulled up by
 * the header height) and is followed by a `.sheet .sheet-overlap`.
 */
export function Hero({ kicker, title, cta, src, alt = "" }: Props) {
  return (
    <section className="relative isolate -mt-(--header-h) h-[100svh] min-h-[36rem] overflow-hidden bg-navy-950 text-ink-on-media">
      {src ? (
        <Image src={src} alt={alt} fill priority sizes="100vw" className="-z-10 object-cover" />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 8%, rgb(200 217 230 / 0.55), transparent 70%), radial-gradient(70% 60% at 85% 85%, rgb(86 124 141 / 0.6), transparent 70%), radial-gradient(60% 60% at 10% 90%, rgb(47 65 86 / 0.9), transparent 70%), linear-gradient(180deg, #2f4156, #141b24)",
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 scrim-bottom" />

      <div className="flex h-full flex-col items-center justify-end px-gutter pb-[calc(var(--radius-sheet)+3.5rem)] text-center">
        {kicker && <p className="animate-rise-in type-overline opacity-85">{kicker}</p>}
        <h1 className="mt-4 max-w-[14ch] animate-rise-in type-display-2xl [animation-delay:70ms]">{title}</h1>
        <Button asChild variant="underline" className="mt-8 animate-rise-in type-body-lg [animation-delay:140ms]">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </div>
    </section>
  )
}

type TileProps = { title: string; href: string; tone: readonly [string, string]; blurb?: string }

/** Rounded editorial tile linking to a collection. */
export function CollectionTile({ title, href, tone, blurb }: TileProps) {
  return (
    <Link href={href} className="group pressable-soft relative block aspect-card overflow-hidden rounded-panel text-ink-on-media">
      <div
        className="absolute inset-0 media-zoom"
        style={{ background: `radial-gradient(90% 70% at 30% 10%, ${tone[1]}, transparent 70%), linear-gradient(165deg, ${tone[0]}, ${tone[1]})` }}
      />
      <div className="absolute inset-0 scrim-bottom" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="type-heading-md md:type-heading-lg">{title}</p>
          {blurb && <p className="mt-1 max-w-xs type-body-sm opacity-85">{blurb}</p>}
        </div>
        <span className="pressable grid h-10 shrink-0 place-items-center rounded-pill bg-white px-5 type-body-sm text-ink transition-transform duration-(--duration-spring) ease-spring group-hover:-translate-y-0.5">
          Shop
        </span>
      </div>
    </Link>
  )
}

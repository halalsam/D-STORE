import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  kicker?: string
  title: string
  cta: { label: string; href: string }
  src?: string
  /** Portrait art for phones; falls back to `src`. */
  mobileSrc?: string
  alt?: string
}

/** Landscape image from md up, portrait below, when both are given. */
function ArtDirected({ src, mobileSrc, alt, priority, sizes, className }: { src: string; mobileSrc?: string; alt: string; priority?: boolean; sizes: string; className?: string }) {
  if (!mobileSrc) return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={className} />
  return (
    <>
      <Image src={mobileSrc} alt={alt} fill priority={priority} sizes="100vw" className={cn(className, "md:hidden")} />
      <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn(className, "max-md:hidden")} />
    </>
  )
}

/**
 * Full-bleed campaign hero. Sits under the transparent header (pulled up by
 * the header height) and is followed by a `.sheet .sheet-overlap`.
 */
export function Hero({ kicker, title, cta, src, mobileSrc, alt = "" }: Props) {
  return (
    <section className="relative isolate -mt-(--header-h) h-[100svh] min-h-[36rem] overflow-hidden bg-canvas text-ink-on-media">
      {src ? (
        <ArtDirected src={src} mobileSrc={mobileSrc} alt={alt} priority sizes="100vw" className="-z-10 object-cover" />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 8%, rgb(122 179 215 / 0.45), transparent 70%), radial-gradient(70% 60% at 85% 85%, rgb(73 111 144 / 0.6), transparent 70%), radial-gradient(60% 60% at 10% 90%, rgb(10 23 48 / 0.9), transparent 70%), linear-gradient(180deg, #0a1730, #040c1d)",
          }}
        />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 scrim-bottom" />
      {src && <div aria-hidden className="absolute inset-0 -z-10 scrim-top" />}

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

type TileProps = { title: string; href: string; tone: readonly [string, string]; blurb?: string; src?: string }

/** Rounded editorial tile linking to a collection. */
export function CollectionTile({ title, href, tone, blurb, src }: TileProps) {
  return (
    <Link href={href} className="group pressable-soft relative block aspect-card overflow-hidden rounded-panel text-ink-on-media">
      {src ? (
        <Image src={src} alt="" fill sizes="(min-width: 768px) 33vw, 80vw" className="media-zoom object-cover" />
      ) : (
        <div
          className="absolute inset-0 media-zoom"
          style={{ background: `radial-gradient(90% 70% at 30% 10%, ${tone[1]}, transparent 70%), linear-gradient(165deg, ${tone[0]}, ${tone[1]})` }}
        />
      )}
      <div className="absolute inset-0 scrim-bottom" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 md:p-6">
        <div>
          <p className="type-heading-md md:type-heading-lg">{title}</p>
          {blurb && <p className="mt-1 max-w-xs type-body-sm opacity-85">{blurb}</p>}
        </div>
        <span className="pressable grid h-10 shrink-0 place-items-center rounded-pill bg-surface-inverse px-5 type-body-sm text-ink-inverse transition-transform duration-(--duration-spring) ease-spring group-hover:-translate-y-0.5">
          Shop
        </span>
      </div>
    </Link>
  )
}

type BannerProps = { title: string; blurb?: string; src: string; mobileSrc?: string }

/**
 * Rounded campaign banner at the top of a collection page. The page heading
 * follows it, so the banner only carries the blurb.
 */
export function CollectionBanner({ title, blurb, src, mobileSrc }: BannerProps) {
  return (
    <section className="page-x pt-2 md:pt-[calc(var(--spacing-section)*0.5)]">
      <div className="relative isolate aspect-[4/5] overflow-hidden rounded-panel bg-canvas text-ink-on-media md:aspect-[2/1] lg:aspect-[5/2]">
        <ArtDirected src={src} mobileSrc={mobileSrc} alt={`${title} campaign`} priority sizes="100vw" className="-z-10 object-cover object-[center_30%]" />
        <div aria-hidden className="absolute inset-0 -z-10 scrim-bottom" />
        {blurb && <p className="absolute inset-x-0 bottom-0 max-w-xl p-5 type-title md:p-10 md:type-heading-lg">{blurb}</p>}
      </div>
    </section>
  )
}

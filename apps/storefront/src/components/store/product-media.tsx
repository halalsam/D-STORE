import Image from "next/image"
import type { Silhouette, Tone } from "@/lib/mock/catalog"
import { cn } from "@/lib/utils"

const shapes: Record<Silhouette, string> = {
  tee: "M30 18 L42 12 C45 17 55 17 58 12 L70 18 L82 32 L72 40 L68 36 L68 88 L32 88 L32 36 L28 40 L18 32 Z",
  shirt: "M31 16 L44 11 L50 20 L56 11 L69 16 L83 34 L74 41 L69 36 L69 89 L31 89 L31 36 L26 41 L17 34 Z M50 20 L50 89",
  hoodie: "M28 22 C34 14 40 10 50 10 C60 10 66 14 72 22 L84 40 L75 46 L70 40 L70 90 L30 90 L30 40 L25 46 L16 40 Z M40 18 C42 28 58 28 60 18",
  bag: "M24 40 L76 40 L72 86 L28 86 Z M36 40 C36 22 64 22 64 40",
  cap: "M22 60 C22 38 36 28 50 28 C64 28 76 38 76 56 L90 62 C80 66 60 66 22 62 Z",
}

type Props = {
  tone: Tone
  silhouette?: Silhouette
  src?: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * Product image. Uses the real `src` when present, otherwise a tonal
 * placeholder with a garment silhouette so layouts read correctly.
 */
export function ProductMedia({ tone, silhouette = "tee", src, alt, sizes, priority, className }: Props) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
        priority={priority}
        className={cn("object-cover", className)}
      />
    )
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn("absolute inset-0", className)}
      style={{ background: `radial-gradient(120% 80% at 30% 0%, ${tone[1]}, transparent 70%), linear-gradient(170deg, ${tone[0]}, ${tone[1]})` }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-[14%] size-[72%]" aria-hidden>
        <path d={shapes[silhouette]} fill="white" fillOpacity="0.16" stroke="white" strokeOpacity="0.35" strokeWidth="0.6" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

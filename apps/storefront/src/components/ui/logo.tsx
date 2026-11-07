import { cn } from "@/lib/utils"

/**
 * MotionFit logo, served from public/brand (cropped from the brand kit).
 * Plain <img>: SVG needs no optimisation and stays cached across pages.
 * Size it by height; width follows the artwork's ratio.
 */
const FILES = {
  logo: { src: "/brand/motionfit-logo.svg", ratio: 11.61 },
  "logo-on-dark": { src: "/brand/motionfit-logo-on-dark.svg", ratio: 11.61 },
  wordmark: { src: "/brand/motionfit-wordmark.svg", ratio: 9.51 },
  mark: { src: "/brand/motionfit-mark.svg", ratio: 3.91 },
  "mark-on-dark": { src: "/brand/motionfit-mark-white.svg", ratio: 3.91 },
} as const

export function Logo({ variant = "logo", className, decorative = false }: { variant?: keyof typeof FILES; className?: string; decorative?: boolean }) {
  const f = FILES[variant]
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={f.src}
      alt={decorative ? "" : "MotionFit"}
      aria-hidden={decorative || undefined}
      width={Math.round(f.ratio * 100)}
      height={100}
      draggable={false}
      className={cn("block h-6 w-auto select-none", className)}
    />
  )
}

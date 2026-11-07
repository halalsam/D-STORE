import { FIT_PATH, MOTION_PATH, WORDMARK_OFFSET, WORDMARK_VIEWBOX } from "@/components/ui/wordmark-paths"
import { cn } from "@/lib/utils"

/** Full-width wordmark: MOTION solid in ink, FIT as a sky dot screen. */
export function FooterWordmark({ className }: { className?: string }) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} aria-hidden focusable="false" className={cn("block h-auto w-full", className)}>
      <defs>
        <pattern id="footer-wordmark-dots" patternUnits="userSpaceOnUse" width="15" height="15">
          <circle cx="7.5" cy="7.5" r="5.6" className="fill-accent" />
        </pattern>
      </defs>
      <g transform={WORDMARK_OFFSET} fillRule="evenodd">
        <path d={MOTION_PATH} className="fill-ink" />
        <path d={FIT_PATH} fill="url(#footer-wordmark-dots)" />
      </g>
    </svg>
  )
}

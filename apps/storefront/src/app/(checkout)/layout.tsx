import Link from "next/link"
import { ArrowLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Distraction-free checkout chrome: no nav, no footer links. */
export default function CheckoutLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="header-grid sticky top-0 z-(--z-header) bg-surface">
        <div>
          <Button asChild variant="ghost" size="md" className="-ml-3">
            <Link href="/"><ArrowLeft strokeWidth={1.6} /><span className="hidden sm:inline">Continue shopping</span></Link>
          </Button>
        </div>
        <Link href="/" className="pressable font-display text-[1.375rem] leading-none font-bold tracking-[-0.04em] sm:text-[1.75rem]">
          D-STORE
        </Link>
        <p className="flex items-center justify-end gap-1.5 type-caption text-ink-muted">
          <Lock className="size-3.5" strokeWidth={1.8} /> <span className="hidden sm:inline">Secure checkout</span>
        </p>
      </header>
      <main className="sheet min-h-[calc(100dvh-var(--header-h))] px-gutter pb-section">{children}</main>
    </div>
  )
}

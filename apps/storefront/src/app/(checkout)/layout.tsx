import Link from "next/link"
import { ArrowLeft, Lock } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

/** Distraction-free checkout chrome: no nav, no footer links. */
export default function CheckoutLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="header-grid sticky top-0 z-(--z-header) bg-header text-ink-inverse">
        <div>
          <Button asChild variant="ghost" size="md" className="-ml-3">
            <Link href="/"><ArrowLeft strokeWidth={1.6} /><span className="hidden sm:inline">Continue shopping</span></Link>
          </Button>
        </div>
        <Link href="/" aria-label="MotionFit home" className="pressable block">
          <Logo variant="logo-on-dark" decorative className="h-3 sm:h-5" />
        </Link>
        <p className="flex items-center justify-end gap-1.5 type-caption text-ink-inverse/75">
          <Lock className="size-3.5" strokeWidth={1.8} /> <span className="hidden sm:inline">Secure checkout</span>
        </p>
      </header>
      <main className="sheet min-h-[calc(100dvh-var(--header-h))] px-gutter pb-section">{children}</main>
    </div>
  )
}

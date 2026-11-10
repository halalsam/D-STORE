"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Popover } from "radix-ui"
import { Bookmark, Menu, Search, ShoppingBag, User, X } from "@/components/ui/icons"
import { useRef, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { CountBubble } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useBag } from "@/lib/stores/bag"
import type { Navigation } from "@/lib/data/navigation"
import { MegaMenu } from "./mega-menu"
import { Logo } from "@/components/ui/logo"

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true })
  return () => window.removeEventListener("scroll", cb)
}
const getScrolled = () => window.scrollY > 12
const getServerScrolled = () => false

/** Routes whose first block is full-bleed media under a transparent header. */
const OVERLAY_ROUTES = new Set(["/"])

export function SiteHeader({ nav }: { nav: Navigation }) {
  const pathname = usePathname()
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled)
  const [menuOpen, setMenuOpen] = useState(false)
  const focusSearch = useRef(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const { count, setOpen: setBagOpen } = useBag()

  const overlay = OVERLAY_ROUTES.has(pathname) && !scrolled && !menuOpen

  const openMenu = (withSearch: boolean) => {
    focusSearch.current = withSearch
  }

  return (
    <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Popover.Anchor asChild>
        <header
          className={cn(
            "header-grid sticky top-0 z-(--z-header) transition-[background-color,color,box-shadow] duration-(--duration-base) ease-standard",
            overlay ? "bg-transparent text-ink-on-media" : "bg-header text-ink-inverse",
            scrolled && !menuOpen && "shadow-sm"
          )}
        >
          {/* Left */}
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="-ml-2 md:hidden">
              <Link href="/search" aria-label="Search"><Search strokeWidth={1.6} /></Link>
            </Button>
            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              <Button asChild variant="ghost" size="md" className="-ml-3 type-body">
                <Link href="/collections/new-arrivals">New in</Link>
              </Button>
              <Popover.Trigger asChild>
                <Button variant="ghost" size="md" onClick={() => openMenu(false)} className="type-body">
                  Collections
                </Button>
              </Popover.Trigger>
            </nav>
          </div>

          {/* Wordmark */}
          <Link
            href="/"
            aria-label="MotionFit home"
            className="pressable block"
          >
            <HeaderLogo />
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5">
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
              <Link href="/search" aria-label="Search"><Search strokeWidth={1.6} /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
              <Link href="/account" aria-label="Account"><User strokeWidth={1.6} /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
              <Link href="/account/saved" aria-label="Saved items"><Bookmark strokeWidth={1.6} /></Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Bag, ${count} items`} onClick={() => setBagOpen(true)} className="relative">
              <ShoppingBag strokeWidth={1.6} />
              <CountBubble count={count} />
            </Button>
            <Popover.Trigger asChild>
              <Button
                variant="media"
                size="sm"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => openMenu(false)}
                className={cn("relative ml-1 w-14 px-0 md:ml-2", !overlay && "bg-header-muted text-ink-inverse hover:bg-navy-600")}
              >
                <Menu
                  strokeWidth={1.6}
                  className={cn("absolute size-5! transition-all duration-(--duration-spring) ease-spring", menuOpen ? "scale-50 rotate-90 opacity-0" : "opacity-100")}
                />
                <X
                  strokeWidth={1.6}
                  className={cn("absolute size-5! transition-all duration-(--duration-spring) ease-spring", menuOpen ? "opacity-100" : "scale-50 -rotate-90 opacity-0")}
                />
              </Button>
            </Popover.Trigger>
          </div>
        </header>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="center"
          sideOffset={0}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            if (focusSearch.current) searchRef.current?.focus()
          }}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setMenuOpen(false)
          }}
          className={cn(
            // Edge-to-edge navy wrapper continuing the header, rounded at the
            // bottom; its corner stays concentric with the panel inside.
            "z-(--z-header) flex w-(--radix-popper-anchor-width) origin-top flex-col bg-header px-3 pb-3 shadow-lg",
            "max-h-[calc(100dvh-var(--header-h))] rounded-b-[calc(var(--radius-panel)+0.75rem)]",
            "data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out"
          )}
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain rounded-panel bg-canvas">
            <MegaMenu nav={nav} searchRef={searchRef} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Static stand-in shown only while URL data streams in on runtime-param routes. */
export function SiteHeaderFallback() {
  return (
    <header className="header-grid sticky top-0 z-(--z-header) bg-header text-ink-inverse">
      <div />
      <Link href="/" aria-label="MotionFit home" className="block">
        <HeaderLogo />
      </Link>
      <div className="flex justify-end">
        <span className="ml-1 h-8 w-14 rounded-pill bg-header-muted md:ml-2" />
      </div>
    </header>
  )
}

/** Under 360px only the mark fits beside the icons. */
function HeaderLogo() {
  return (
    <span className="relative block">
      <Logo variant="logo-on-dark" decorative className="hidden h-3 min-[360px]:block sm:h-5 lg:h-6" />
      <Logo variant="mark-on-dark" decorative className="h-5 min-[360px]:hidden" />
    </span>
  )
}

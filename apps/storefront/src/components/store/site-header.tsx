"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Popover } from "radix-ui"
import { Bookmark, MapPin, Menu, Search, ShoppingBag, User, X } from "@/components/ui/icons"
import { useRef, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { CountBubble } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useBag } from "@/lib/stores/bag"
import { MegaMenu } from "./mega-menu"

function subscribeScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true })
  return () => window.removeEventListener("scroll", cb)
}
const getScrolled = () => window.scrollY > 12
const getServerScrolled = () => false

/** Routes whose first block is full-bleed media under a transparent header. */
const OVERLAY_ROUTES = new Set(["/"])

export function SiteHeader() {
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
            overlay ? "bg-transparent text-ink-on-media" : "bg-surface text-ink",
            scrolled && !menuOpen && "shadow-[0_1px_0_var(--color-line)]"
          )}
        >
          {/* Left */}
          <div className="flex items-center gap-1">
            <Popover.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Search" onClick={() => openMenu(true)} className="-ml-2 md:hidden">
                <Search strokeWidth={1.6} />
              </Button>
            </Popover.Trigger>
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
            aria-label="D-STORE home"
            className="pressable font-display text-[1.375rem] leading-none font-bold tracking-[-0.04em] sm:text-[1.75rem] lg:text-[2.125rem]"
          >
            D-STORE
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end gap-0.5">
            <Button asChild variant="ghost" size="icon" className="hidden md:inline-flex">
              <Link href="/stores" aria-label="Find a store"><MapPin strokeWidth={1.6} /></Link>
            </Button>
            <Popover.Trigger asChild>
              <Button variant="ghost" size="icon" aria-label="Search" onClick={() => openMenu(true)} className="hidden md:inline-flex">
                <Search strokeWidth={1.6} />
              </Button>
            </Popover.Trigger>
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
                variant={overlay ? "media" : "soft"}
                size="sm"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => openMenu(false)}
                className="relative ml-1 w-14 px-0 md:ml-2"
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
            "z-(--z-header) w-[calc(var(--radix-popper-anchor-width)-1.25rem)] origin-top",
            "max-h-[calc(100dvh-var(--header-h)-0.75rem)] overflow-y-auto overscroll-contain rounded-panel bg-canvas shadow-lg",
            "data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out"
          )}
        >
          <MegaMenu searchRef={searchRef} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Static stand-in shown only while URL data streams in on runtime-param routes. */
export function SiteHeaderFallback() {
  return (
    <header className="header-grid sticky top-0 z-(--z-header) bg-surface text-ink">
      <div />
      <Link href="/" className="font-display text-[1.375rem] leading-none font-bold tracking-[-0.04em] sm:text-[1.75rem] lg:text-[2.125rem]">
        D-STORE
      </Link>
      <div className="flex justify-end">
        <span className="ml-1 h-8 w-14 rounded-pill bg-surface-muted md:ml-2" />
      </div>
    </header>
  )
}

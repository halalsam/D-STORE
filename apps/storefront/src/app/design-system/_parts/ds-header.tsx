import Link from "next/link"
import { Bookmark, MapPin, Menu, Search, ShoppingBag, User } from "@/components/ui/icons"

const icons = [
  { Icon: MapPin, label: "Stores", mobile: false },
  { Icon: Search, label: "Search", mobile: false },
  { Icon: User, label: "Account", mobile: false },
  { Icon: Bookmark, label: "Saved", mobile: false },
  { Icon: ShoppingBag, label: "Bag", mobile: true },
]

/** Header anatomy from the reference: links / wordmark / actions + menu pill. */
export function DsHeader({ overMedia = false }: { overMedia?: boolean }) {
  return (
    <header
      className={
        overMedia
          ? "header-grid text-ink-on-media"
          : "header-grid bg-surface text-ink"
      }
    >
      <div className="md:hidden">
        <button aria-label="Search" className="pressable -ml-2 grid size-10 place-items-center rounded-pill hover:bg-current/8">
          <Search className="size-[1.2rem]" strokeWidth={1.6} />
        </button>
      </div>
      <nav className="hidden items-center gap-7 type-body md:flex">
        <Link href="#layout" className="pressable opacity-90 hover:opacity-100">New in</Link>
        <Link href="#layout" className="pressable opacity-90 hover:opacity-100">Collections</Link>
      </nav>
      <Link
        href="/design-system"
        className="font-display text-[1.375rem] leading-none font-bold tracking-[-0.04em] sm:text-[1.75rem] lg:text-[2.125rem]"
      >
        D-STORE
      </Link>
      <div className="flex items-center justify-end gap-1">
        {icons.map(({ Icon, label, mobile }) => (
          <button
            key={label}
            aria-label={label}
            className={
              "pressable size-10 place-items-center rounded-pill hover:bg-current/8 " +
              (mobile ? "grid" : "hidden md:grid")
            }
          >
            <Icon className="size-[1.2rem]" strokeWidth={1.6} />
          </button>
        ))}
        <button
          aria-label="Menu"
          className={
            overMedia
              ? "pressable ml-1 grid h-9 w-14 md:ml-2 place-items-center rounded-pill bg-white text-ink"
              : "pressable ml-1 grid h-9 w-14 md:ml-2 place-items-center rounded-pill bg-surface-muted"
          }
        >
          <Menu className="size-5" strokeWidth={1.6} />
        </button>
      </div>
    </header>
  )
}

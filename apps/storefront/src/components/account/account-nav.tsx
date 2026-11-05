"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition, type ReactNode } from "react"
import { Bookmark, LayoutGrid, LogOut, MapPin, Package, UserRound } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/data/customer"
import { syncBag } from "@/lib/stores/bag"
import { syncSaved } from "@/lib/stores/saved"
import type { Customer } from "@/lib/types"
import { cn } from "@/lib/utils"

const items = [
  { href: "/account", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/saved", label: "Saved", icon: Bookmark },
]

export function useSignOut() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const run = () =>
    start(async () => {
      await signOut()
      await Promise.all([syncBag(true), syncSaved()])
      router.push("/sign-in")
    })
  return { pending, run }
}

export function AccountNav({ customer }: { customer: Customer }) {
  const pathname = usePathname()
  const out = useSignOut()
  const initials = `${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`.toUpperCase() || customer.email[0]?.toUpperCase()
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href))

  return (
    <aside className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+0.5rem)] lg:self-start">
      <div className="panel p-3 lg:p-3">
        <div className="flex items-center gap-3 p-2 lg:pb-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-pill bg-surface-inverse type-title text-ink-inverse">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate type-title">{customer.firstName || "Your account"} {customer.lastName}</p>
            <p className="truncate type-caption text-ink-muted">{customer.email}</p>
          </div>
        </div>

        <nav aria-label="Account" className="no-scrollbar -mx-3 mt-2 flex gap-1.5 overflow-x-auto px-3 lg:mx-0 lg:mt-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:px-0">
          {items.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "pressable flex h-10 shrink-0 items-center gap-3 rounded-pill px-4 type-body-sm transition-colors duration-(--duration-fast)",
                  "lg:h-11 lg:rounded-md lg:px-3",
                  active ? "bg-surface-inverse text-ink-inverse" : "bg-surface-muted text-ink hover:bg-surface-strong lg:bg-transparent lg:hover:bg-surface-muted"
                )}
              >
                <Icon className="hidden size-[1.1rem] lg:block" strokeWidth={1.6} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-2 hidden border-t border-line pt-2 lg:block">
          <Button variant="ghost" size="md" loading={out.pending} className="w-full justify-start rounded-md px-3 text-ink-muted" onClick={out.run}>
            <LogOut strokeWidth={1.6} /> Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function PageTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
      <div>
        <h1 className="type-heading-lg">{title}</h1>
        {description && <p className="mt-1 type-body-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

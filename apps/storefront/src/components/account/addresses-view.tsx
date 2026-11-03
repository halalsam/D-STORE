"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Plus } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { deleteAddress, saveAddress } from "@/lib/data/customer"
import type { Address } from "@/lib/types"
import { AddressCard } from "./address-card"
import { AddressForm } from "./address-form"
import { PageTitle } from "./account-nav"

export function AddressesView({ addresses }: { addresses: Address[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Address | "new" | null>(null)
  const [pending, start] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const current = editing === "new" ? undefined : editing ?? undefined

  const save = (a: Address) =>
    start(async () => {
      const res = await saveAddress(a, editing === "new")
      if (!res.ok) return void toast(res.error, "error")
      setEditing(null)
      toast("Address saved")
      router.refresh()
    })

  const run = (id: string, fn: () => Promise<{ ok: boolean; error?: string }>, done: string) => {
    setBusyId(id)
    start(async () => {
      const res = await fn()
      setBusyId(null)
      if (!res.ok) return void toast(res.error ?? "Something went wrong", "error")
      toast(done)
      router.refresh()
    })
  }

  return (
    <div>
      <PageTitle
        title="Addresses"
        description="Saved addresses fill in automatically at checkout."
        action={
          <Button size="md" onClick={() => setEditing("new")}>
            <Plus strokeWidth={1.6} /> Add address
          </Button>
        }
      />
      <div className="grid gap-grid md:grid-cols-2 2xl:grid-cols-3">
        {addresses.map((a, i) => (
          <AddressCard
            key={a.id}
            address={a}
            className="animate-rise-in"
            style={{ animationDelay: `${i * 45}ms` }}
            actions={
              <>
                <Button variant="soft" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" disabled={busyId === a.id} onClick={() => run(a.id, () => saveAddress({ ...a, isDefault: true }, false), "Default address updated")}>
                    Make default
                  </Button>
                )}
                <Button variant="ghost" size="sm" loading={busyId === a.id} className="ml-auto text-danger" onClick={() => run(a.id, () => deleteAddress(a.id), "Address removed")}>
                  Remove
                </Button>
              </>
            }
          />
        ))}
        <button
          onClick={() => setEditing("new")}
          className="pressable-soft grid min-h-56 place-items-center rounded-xl border-2 border-dashed border-line-strong text-ink-muted transition-colors hover:border-ink-subtle hover:text-ink"
        >
          <span className="grid justify-items-center gap-2">
            <span className="grid size-11 place-items-center rounded-pill bg-surface"><Plus className="size-5" strokeWidth={1.6} /></span>
            <span className="type-body-sm">Add a new address</span>
          </span>
        </button>
      </div>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent
          side="adaptive"
          title={editing === "new" ? "New address" : "Edit address"}
          bodyClassName="p-5 md:p-6"
          footer={
            <>
              <Button variant="secondary" size="xl" onClick={() => setEditing(null)}>Cancel</Button>
              <Button size="xl" type="submit" form="address-sheet-form" loading={pending && busyId === null}>Save</Button>
            </>
          }
        >
          <AddressForm key={current?.id ?? "new"} id="address-sheet-form" initial={current} allowDefault onSubmit={save} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

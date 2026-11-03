"use client"

import { Plus } from "@/components/ui/icons"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import type { Address } from "@/lib/mock/account"
import { removeAddress, saveAddress, useAddresses } from "@/lib/stores/account"
import { AddressCard } from "./address-card"
import { AddressForm } from "./address-form"
import { PageTitle } from "./account-nav"

export function AddressesView() {
  const addresses = useAddresses()
  const [editing, setEditing] = useState<Address | "new" | null>(null)
  const current = editing === "new" ? undefined : editing ?? undefined

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
            actions={
              <>
                <Button variant="soft" size="sm" onClick={() => setEditing(a)}>Edit</Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => saveAddress({ ...a, isDefault: true })}>Make default</Button>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-danger" onClick={() => removeAddress(a.id)}>Remove</Button>
              </>
            }
            style={{ animationDelay: `${i * 45}ms` }}
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
              <Button size="xl" type="submit" form="address-sheet-form">Save</Button>
            </>
          }
        >
          <AddressForm
            key={current?.id ?? "new"}
            id="address-sheet-form"
            initial={current}
            allowDefault
            onSubmit={(a) => {
              saveAddress(a)
              setEditing(null)
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

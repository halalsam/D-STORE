"use client"

import { Check } from "@/components/ui/icons"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { TextField } from "@/components/ui/text-field"
import { customerStore, useCustomer } from "@/lib/stores/account"
import { PageTitle } from "./account-nav"

function useSaveState() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle")
  const run = (fn: () => void) => {
    setState("saving")
    setTimeout(() => {
      fn()
      setState("saved")
      setTimeout(() => setState("idle"), 2200)
    }, 600)
  }
  return { state, run }
}

function Saved({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex animate-rise-in items-center gap-1.5 type-body-sm text-success">
      <Check className="size-4" /> Saved
    </span>
  )
}

export function ProfileView() {
  const customer = useCustomer()
  const router = useRouter()
  const details = useSaveState()
  const password = useSaveState()
  const [pwError, setPwError] = useState<string>()

  const saveDetails = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    details.run(() =>
      customerStore.set((c) => ({
        ...c,
        firstName: String(f.get("firstName") || c.firstName),
        lastName: String(f.get("lastName") || c.lastName),
        email: String(f.get("email") || c.email),
        phone: String(f.get("phone") || c.phone),
      }))
    )
  }

  const savePassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const next = String(new FormData(form).get("new") ?? "")
    if (next.length < 8) {
      setPwError("Use at least 8 characters")
      return
    }
    setPwError(undefined)
    password.run(() => form.reset())
  }

  return (
    <div>
      <PageTitle title="Profile" description="Your details and how we keep in touch." />
      <div className="grid gap-grid xl:grid-cols-2">
        <section className="panel">
          <h2 className="type-title">Personal details</h2>
          <form onSubmit={saveDetails} className="mt-5 grid gap-4" key={customer.email}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="firstName" label="First name" defaultValue={customer.firstName} autoComplete="given-name" />
              <TextField name="lastName" label="Last name" defaultValue={customer.lastName} autoComplete="family-name" />
            </div>
            <TextField name="email" type="email" label="Email" defaultValue={customer.email} autoComplete="email" />
            <TextField name="phone" type="tel" label="Phone" defaultValue={customer.phone} autoComplete="tel" />
            <div className="flex items-center gap-4 pt-1">
              <Button type="submit" size="lg" loading={details.state === "saving"}>Save changes</Button>
              <Saved show={details.state === "saved"} />
            </div>
          </form>
        </section>

        <div className="grid content-start gap-grid">
          <section className="panel">
            <h2 className="type-title">Notifications</h2>
            <div className="mt-5 grid gap-5">
              <Switch
                label="News and early access"
                description="Drops, restocks and members-only offers by email."
                checked={customer.marketing}
                onCheckedChange={(v) => customerStore.set((c) => ({ ...c, marketing: v }))}
              />
              <div className="h-px bg-line" />
              <Switch
                label="Order updates by SMS"
                description="Dispatch and delivery messages to your phone."
                checked={customer.orderUpdatesSms}
                onCheckedChange={(v) => customerStore.set((c) => ({ ...c, orderUpdatesSms: v }))}
              />
            </div>
          </section>

          <section className="panel">
            <h2 className="type-title">Password</h2>
            <form onSubmit={savePassword} className="mt-5 grid gap-4">
              <TextField name="current" type="password" label="Current password" autoComplete="current-password" />
              <TextField name="new" type="password" label="New password" autoComplete="new-password" hint="At least 8 characters" error={pwError} />
              <div className="flex items-center gap-4 pt-1">
                <Button type="submit" variant="secondary" size="lg" loading={password.state === "saving"}>Update password</Button>
                <Saved show={password.state === "saved"} />
              </div>
            </form>
          </section>

          <section className="panel flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="type-title">Sign out</h2>
              <p className="mt-1 type-body-sm text-ink-muted">You will need your email to sign back in.</p>
            </div>
            <Button variant="soft" size="md" onClick={() => router.push("/sign-in")}>Sign out</Button>
          </section>
        </div>
      </div>
    </div>
  )
}

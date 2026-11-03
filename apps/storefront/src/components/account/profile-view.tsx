"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition, type FormEvent } from "react"
import { Check } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { TextField } from "@/components/ui/text-field"
import { toast } from "@/components/ui/toast"
import { requestPasswordReset, updateProfile } from "@/lib/data/customer"
import type { Customer } from "@/lib/types"
import { PageTitle, useSignOut } from "./account-nav"

export function ProfileView({ customer }: { customer: Customer }) {
  const router = useRouter()
  const out = useSignOut()
  const [saving, startSave] = useTransition()
  const [resetting, startReset] = useTransition()
  const [saved, setSaved] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [prefs, setPrefs] = useState({ marketing: customer.marketing, orderUpdatesSms: customer.orderUpdatesSms })

  const saveDetails = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    startSave(async () => {
      const res = await updateProfile({
        firstName: String(f.get("firstName") ?? ""),
        lastName: String(f.get("lastName") ?? ""),
        phone: String(f.get("phone") ?? ""),
      })
      if (!res.ok) return void toast(res.error, "error")
      setSaved(true)
      router.refresh()
      setTimeout(() => setSaved(false), 2200)
    })
  }

  const setPref = async (key: "marketing" | "orderUpdatesSms", value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    const res = await updateProfile({ [key]: value })
    if (!res.ok) {
      setPrefs((p) => ({ ...p, [key]: !value }))
      toast(res.error, "error")
    }
  }

  return (
    <div>
      <PageTitle title="Profile" description="Your details and how we keep in touch." />
      <div className="grid gap-tile xl:grid-cols-2">
        <section className="panel">
          <h2 className="type-title">Personal details</h2>
          <form onSubmit={saveDetails} className="mt-5 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="firstName" label="First name" defaultValue={customer.firstName} autoComplete="given-name" />
              <TextField name="lastName" label="Last name" defaultValue={customer.lastName} autoComplete="family-name" />
            </div>
            <TextField name="email" type="email" label="Email" defaultValue={customer.email} disabled hint="Contact support to change your email." />
            <TextField name="phone" type="tel" label="Phone" defaultValue={customer.phone} autoComplete="tel" />
            <div className="flex items-center gap-4 pt-1">
              <Button type="submit" size="lg" loading={saving}>Save changes</Button>
              {saved && (
                <span className="inline-flex animate-rise-in items-center gap-1.5 type-body-sm text-success">
                  <Check className="size-4" /> Saved
                </span>
              )}
            </div>
          </form>
        </section>

        <div className="grid content-start gap-tile">
          <section className="panel">
            <h2 className="type-title">Notifications</h2>
            <div className="mt-5 grid gap-5">
              <Switch
                label="News and early access"
                description="Drops, restocks and members-only offers by email."
                checked={prefs.marketing}
                onCheckedChange={(v) => void setPref("marketing", v)}
              />
              <div className="h-px bg-line" />
              <Switch
                label="Order updates by SMS"
                description="Dispatch and delivery messages to your phone."
                checked={prefs.orderUpdatesSms}
                onCheckedChange={(v) => void setPref("orderUpdatesSms", v)}
              />
            </div>
          </section>

          <section className="panel flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="type-title">Password</h2>
              <p className="mt-1 type-body-sm text-ink-muted">
                {resetSent ? `If ${customer.email} has an account, a reset link is on its way.` : "We will email you a secure link to set a new password."}
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              loading={resetting}
              disabled={resetSent}
              onClick={() =>
                startReset(async () => {
                  const res = await requestPasswordReset(customer.email)
                  if (!res.ok) return void toast(res.error, "error")
                  setResetSent(true)
                })
              }
            >
              {resetSent ? "Link sent" : "Send reset link"}
            </Button>
          </section>

          <section className="panel flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="type-title">Sign out</h2>
              <p className="mt-1 type-body-sm text-ink-muted">You will need your email and password to sign back in.</p>
            </div>
            <Button variant="soft" size="md" loading={out.pending} onClick={out.run}>Sign out</Button>
          </section>
        </div>
      </div>
    </div>
  )
}

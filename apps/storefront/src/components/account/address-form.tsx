"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select } from "@/components/ui/select"
import { TextField } from "@/components/ui/text-field"
import { indianStates } from "@/lib/site"
import { useShake } from "@/lib/use-shake"
import type { Address } from "@/lib/types"
import { cn } from "@/lib/utils"

type Errors = Partial<Record<keyof Address, string>>

const required: (keyof Address)[] = ["firstName", "lastName", "phone", "line1", "city", "state", "postalCode"]

function validate(a: Partial<Address>): Errors {
  const e: Errors = {}
  for (const k of required) if (!String(a[k] ?? "").trim()) e[k] = "Required"
  if (a.postalCode && !/^\d{6}$/.test(a.postalCode)) e.postalCode = "Enter a 6 digit PIN code"
  if (a.phone && a.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid phone number"
  return e
}

type Props = {
  id: string
  initial?: Partial<Address>
  /** Show the "Set as default" checkbox (account only). */
  allowDefault?: boolean
  onSubmit: (address: Address) => void
  /** Rendered after the fields (submit buttons). */
  children?: ReactNode
  className?: string
}

/**
 * Shipping address fields. Validates on submit with inline errors.
 * The form element has `id` so a button elsewhere can submit it (form=...).
 */
export function AddressForm({ id, initial, allowDefault = false, onSubmit, children, className }: Props) {
  const [errors, setErrors] = useState<Errors>({})
  const [shakeRef, shake] = useShake<HTMLDivElement>()

  const clear = (name: string) =>
    setErrors((prev) => {
      if (!(name in prev)) return prev
      const next = { ...prev }
      delete next[name as keyof Address]
      return next
    })

  const handle = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const a: Address = {
      id: initial?.id ?? `addr_${Math.random().toString(36).slice(2, 9)}`,
      label: String(f.get("label") ?? "").trim() || undefined,
      firstName: String(f.get("firstName") ?? "").trim(),
      lastName: String(f.get("lastName") ?? "").trim(),
      phone: String(f.get("phone") ?? "").trim(),
      line1: String(f.get("line1") ?? "").trim(),
      line2: String(f.get("line2") ?? "").trim() || undefined,
      city: String(f.get("city") ?? "").trim(),
      state: String(f.get("state") ?? ""),
      postalCode: String(f.get("postalCode") ?? "").trim(),
      country: "India",
      isDefault: allowDefault ? f.get("isDefault") === "on" : initial?.isDefault,
    }
    const errs = validate(a)
    setErrors(errs)
    if (Object.keys(errs).length) {
      shake()
      return
    }
    onSubmit(a)
  }

  const field = (name: keyof Address, label: string, extra?: Partial<Parameters<typeof TextField>[0]>) => (
    <TextField
      name={name}
      label={label}
      defaultValue={(initial?.[name] as string | undefined) ?? ""}
      error={errors[name]}
      {...extra}
    />
  )

  return (
    <form
      id={id}
      noValidate
      onSubmit={handle}
      onInput={(e) => clear((e.target as HTMLInputElement).name)}
      className={cn("grid gap-4", className)}
    >
      <div ref={shakeRef} className="grid gap-4">
        {allowDefault && field("label", "Label (optional)", { placeholder: "Home, Studio..." })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("firstName", "First name", { autoComplete: "given-name" })}
          {field("lastName", "Last name", { autoComplete: "family-name" })}
        </div>
        {field("line1", "Address", { autoComplete: "address-line1", placeholder: "House number, building, street" })}
        {field("line2", "Apartment, area (optional)", { autoComplete: "address-line2" })}
        <div className="grid gap-4 sm:grid-cols-3">
          {field("city", "City", { autoComplete: "address-level2" })}
          <div className="grid min-w-0 gap-1.5">
            <label htmlFor={`${id}-state`} className="type-body-sm text-ink">State</label>
            <Select
              id={`${id}-state`}
              name="state"
              label="State"
              placeholder="Select"
              defaultValue={initial?.state}
              invalid={!!errors.state}
              onValueChange={() => clear("state")}
              options={indianStates.map((s) => ({ value: s, label: s }))}
            />
            {errors.state && <p className="animate-rise-in type-caption text-danger">{errors.state}</p>}
          </div>
          {field("postalCode", "PIN code", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
        </div>
        {field("phone", "Phone", { type: "tel", autoComplete: "tel", hint: "For delivery updates only" })}
        {allowDefault && <Checkbox name="isDefault" label="Set as default address" defaultChecked={initial?.isDefault} />}
      </div>
      {children}
    </form>
  )
}

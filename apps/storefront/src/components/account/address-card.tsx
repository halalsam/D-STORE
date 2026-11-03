import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import type { Address } from "@/lib/mock/account"
import { cn } from "@/lib/utils"

type Props = {
  address: Omit<Address, "id"> & { id?: string }
  actions?: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function AddressLines({ address }: { address: Props["address"] }) {
  return (
    <address className="type-body-sm text-ink-muted not-italic">
      <span className="block font-medium text-ink">{address.firstName} {address.lastName}</span>
      <span className="block">{address.line1}</span>
      {address.line2 && <span className="block">{address.line2}</span>}
      <span className="block">{address.city}, {address.state} {address.postalCode}</span>
      <span className="block">{address.country}</span>
      <span className="mt-1 block tabular-nums">{address.phone}</span>
    </address>
  )
}

export function AddressCard({ address, actions, className, style }: Props) {
  return (
    <div style={style} className={cn("flex flex-col justify-between gap-5 rounded-xl bg-surface p-5 ring-1 ring-line ring-inset", className)}>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="type-title">{address.label ?? "Address"}</p>
          {address.isDefault && <Badge tone="accent">Default</Badge>}
        </div>
        <AddressLines address={address} />
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

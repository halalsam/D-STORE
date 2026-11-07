import type { Metadata } from "next"
import Link from "next/link"
import { FactGrid, InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Stores", description: "Visit MotionFit Bandra in Mumbai, or pick up your order there." }

export default function StoresPage() {
  return (
    <InfoPage nav="company" current="/stores" title="Stores" intro="One store for now, in Bandra West, Mumbai.">
      <InfoSection title="MotionFit Bandra">
        <FactGrid
          items={[
            { title: "Address", value: "Bandra West", note: "Mumbai 400050, Maharashtra" },
            { title: "Pick up in store", value: "Free", note: "Orders ready in 24 hours" },
          ]}
        />
        <p>
          Choose <strong>Pick up in store</strong> at checkout and we will hold your order here. Bring your order number when you collect it. Delivery options for the
          rest of India are on the <Link href="/help/shipping">Shipping</Link> page.
        </p>
      </InfoSection>
    </InfoPage>
  )
}

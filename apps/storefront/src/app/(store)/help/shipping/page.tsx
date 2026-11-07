import type { Metadata } from "next"
import Link from "next/link"
import { FactGrid, InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Shipping", description: "Delivery options, timings and costs across India." }

export default function ShippingPage() {
  return (
    <InfoPage nav="help" current="/help/shipping" title="Shipping" intro="We deliver across India. Orders are packed within 24 hours and dispatched the next business day.">
      <InfoSection title="Delivery options">
        <p>Choose one at checkout. Prices include GST.</p>
        <FactGrid
          items={[
            { title: "Standard delivery", value: "Free", note: "3 to 5 business days" },
            { title: "Express delivery", value: "₹250", note: "1 to 2 business days, metro cities" },
            { title: "Pick up in store", value: "Free", note: "MotionFit Bandra, ready in 24 hours" },
          ]}
        />
      </InfoSection>
      <InfoSection title="Tracking your order">
        <p>
          Once your order ships, its status and tracking number appear under <Link href="/account/orders">Account, Orders</Link>. Business days are Monday to
          Saturday, excluding public holidays.
        </p>
      </InfoSection>
      <InfoSection title="Paying on delivery">
        <p>Cash on delivery is available on every option. You can also pay by UPI or card at checkout.</p>
      </InfoSection>
      <InfoSection title="Store pickup">
        <p>
          Pick up in store orders are held at MotionFit Bandra. We will let you know when yours is ready; bring your order number. See{" "}
          <Link href="/stores">Stores</Link> for the address.
        </p>
      </InfoSection>
    </InfoPage>
  )
}

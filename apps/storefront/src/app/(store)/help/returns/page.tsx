import type { Metadata } from "next"
import Link from "next/link"
import { InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Returns", description: "Fourteen day returns on every order." }

export default function ReturnsPage() {
  return (
    <InfoPage nav="help" current="/help/returns" title="Returns" intro="Changed your mind? Return any item within 14 days of delivery.">
      <InfoSection title="What can be returned">
        <p>Items must be unworn and unwashed, with the original tags attached, in their original packaging.</p>
        <p>Caps and bags must be unused.</p>
      </InfoSection>
      <InfoSection title="How to start a return">
        <ol className="grid list-decimal gap-2 pl-5">
          <li>
            Find the order under <Link href="/account/orders">Account, Orders</Link> and note the order number.
          </li>
          <li>
            Send us the order number and the items you are returning through the <Link href="/help/contact">contact form</Link>.
          </li>
          <li>We confirm by email and arrange a pickup from your delivery address.</li>
        </ol>
      </InfoSection>
      <InfoSection title="Refunds">
        <p>
          Once the return reaches us and passes a quality check, we refund the item price to your original payment method. Cash on delivery orders are refunded by
          UPI or bank transfer.
        </p>
      </InfoSection>
      <InfoSection title="Exchanges">
        <p>Need a different size? Return the item and place a new order, so the size you want is not held up while the return travels back.</p>
      </InfoSection>
    </InfoPage>
  )
}

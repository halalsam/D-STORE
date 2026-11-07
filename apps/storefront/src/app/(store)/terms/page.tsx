import type { Metadata } from "next"
import Link from "next/link"
import { InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Terms of service", description: "The terms that apply when you shop with MotionFit." }

// Plain-language draft. Review with counsel before launch.
export default function TermsPage() {
  return (
    <InfoPage nav="company" current="/terms" title="Terms of service" intro="Last updated 3 November 2026. By placing an order you agree to these terms.">
      <InfoSection title="Orders">
        <p>
          Placing an order is an offer to buy. The contract is formed when we confirm your order by email. If an item turns out to be unavailable after you order, we
          will tell you and refund anything you paid for it.
        </p>
      </InfoSection>
      <InfoSection title="Prices and payment">
        <p>
          Prices are in Indian rupees and include GST. Delivery charges, if any, are shown at checkout before you pay. You can pay by UPI, card or cash on delivery.
        </p>
      </InfoSection>
      <InfoSection title="Delivery">
        <p>
          We deliver within India. Delivery times are estimates; see <Link href="/help/shipping">Shipping</Link> for the options. Risk in the goods passes to you on
          delivery.
        </p>
      </InfoSection>
      <InfoSection title="Returns">
        <p>
          You can return items within 14 days of delivery under our <Link href="/help/returns">returns policy</Link>.
        </p>
      </InfoSection>
      <InfoSection title="Your account">
        <p>Keep your sign in details private. You are responsible for orders placed from your account.</p>
      </InfoSection>
      <InfoSection title="Site content">
        <p>Product photos, artwork and text on this site belong to their owners and may not be copied or reused without permission.</p>
      </InfoSection>
      <InfoSection title="Governing law">
        <p>These terms are governed by the laws of India.</p>
      </InfoSection>
    </InfoPage>
  )
}

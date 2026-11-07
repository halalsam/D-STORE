import type { Metadata } from "next"
import Link from "next/link"
import { ContactForm } from "@/components/store/contact-form"
import { InfoPage, InfoSection } from "@/components/store/info-page"
import { DEMO_MODE } from "@/lib/data/mode"

export const metadata: Metadata = { title: "Contact", description: "Get in touch about an order, a return or sizing." }

export default function ContactPage() {
  return (
    <InfoPage nav="help" current="/help/contact" title="Contact" intro="Questions about an order, a return or sizing? Send us a message and we will reply by email.">
      <InfoSection title="Send a message">
        <ContactForm demo={DEMO_MODE} />
      </InfoSection>
      <InfoSection title="Quick answers">
        <ul className="grid gap-2">
          <li>
            Delivery times and costs: <Link href="/help/shipping">Shipping</Link>
          </li>
          <li>
            Sending something back: <Link href="/help/returns">Returns</Link>
          </li>
          <li>
            Finding your fit: <Link href="/help/size-guide">Size guide</Link>
          </li>
        </ul>
      </InfoSection>
    </InfoPage>
  )
}

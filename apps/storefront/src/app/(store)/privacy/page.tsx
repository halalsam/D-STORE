import type { Metadata } from "next"
import Link from "next/link"
import { InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Privacy policy", description: "What D-STORE collects, why, and how to reach us about it." }

// Plain-language draft describing what the storefront actually stores. Review with counsel before launch.
export default function PrivacyPage() {
  return (
    <InfoPage nav="company" current="/privacy" title="Privacy policy" intro="Last updated 3 November 2026.">
      <InfoSection title="What we collect">
        <ul className="grid list-disc gap-2 pl-5">
          <li>Account details you give us: name, email address and phone number.</li>
          <li>Delivery addresses you save or enter at checkout.</li>
          <li>Your orders, what they contained and how they were paid for.</li>
          <li>Messages you send us and newsletter sign ups.</li>
        </ul>
        <p>
          Card and UPI payments are handled by our payment provider. We never see or store your full card number or UPI PIN.
        </p>
      </InfoSection>
      <InfoSection title="Why we use it">
        <p>To take and deliver your orders, run your account, handle returns and answer your messages. If you sign up for the newsletter, we email you about new drops; every email has an unsubscribe link.</p>
        <p>We do not sell your personal data.</p>
      </InfoSection>
      <InfoSection title="Cookies and local storage">
        <p>We use a small number of essential cookies, and no advertising or tracking cookies:</p>
        <ul className="grid list-disc gap-2 pl-5">
          <li>
            <strong>Sign in</strong>: keeps you signed in for up to 7 days.
          </li>
          <li>
            <strong>Bag</strong>: remembers what is in your bag for up to 30 days.
          </li>
        </ul>
        <p>Saved items are kept in your browser&apos;s local storage and never leave your device.</p>
      </InfoSection>
      <InfoSection title="Who we share it with">
        <p>Only the partners needed to fulfil your order: our payment provider and delivery partners, who receive the details they need to do their part.</p>
      </InfoSection>
      <InfoSection title="Your choices">
        <p>
          You can update your details and addresses from <Link href="/account/profile">your account</Link>. To get a copy of your data or have it deleted, write to us
          through the <Link href="/help/contact">contact form</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}

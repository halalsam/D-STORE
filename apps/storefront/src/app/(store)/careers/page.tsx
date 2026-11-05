import type { Metadata } from "next"
import Link from "next/link"
import { InfoPage, InfoSection } from "@/components/store/info-page"

export const metadata: Metadata = { title: "Careers", description: "Work with D-STORE." }

export default function CareersPage() {
  return (
    <InfoPage nav="company" current="/careers" title="Careers" intro="Work with us.">
      <InfoSection title="Open roles">
        <p>There are no open roles right now. New roles will be listed on this page.</p>
        <p>
          If you would like us to keep you in mind, send a short note about yourself and the work you do through the <Link href="/help/contact">contact form</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}

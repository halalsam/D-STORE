import type { Metadata } from "next"
import Link from "next/link"
import { InfoPage, InfoSection } from "@/components/store/info-page"
import { DEMO_MODE } from "@/lib/data/mode"

export const metadata: Metadata = { title: "About", description: "MotionFit is a streetwear store from Mumbai, shipping across India." }

export default function AboutPage() {
  return (
    <InfoPage nav="company" current="/about" title="About MotionFit" intro="A streetwear store from Mumbai, shipping across India.">
      <InfoSection title="What we do">
        <p>
          MotionFit brings together graphic tees, shirts, outerwear and accessories in one place, with clear sizing, honest prices in rupees and delivery to every
          pin code we can reach.
        </p>
        <p>
          New pieces land in drops. Follow the <Link href="/collections/new-arrivals">Latest Drop</Link> to see what just arrived.
        </p>
      </InfoSection>
      <InfoSection title="How we work">
        <ul className="grid gap-2">
          <li>
            <strong>Free standard delivery</strong> on every order, with express delivery in metro cities.
          </li>
          <li>
            <strong>Fourteen day returns</strong>, started from your order page.
          </li>
          <li>
            <strong>Pay how you like</strong>: UPI, card or cash on delivery.
          </li>
        </ul>
      </InfoSection>
      {DEMO_MODE && (
        <InfoSection title="About this demo">
          <p>
            This is a demonstration build of the MotionFit storefront. The products, photos and campaign images shown are from BLUORNG and are used here for demonstration
            only. No orders are placed or charged.
          </p>
        </InfoSection>
      )}
    </InfoPage>
  )
}

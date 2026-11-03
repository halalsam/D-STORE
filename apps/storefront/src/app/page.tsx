import Link from "next/link"

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-8">
      <div className="text-center">
        <p className="type-overline text-ink-muted">Storefront scaffold</p>
        <h1 className="mt-3 type-display-lg">D-STORE</h1>
        <Link
          href="/design-system"
          className="pressable mt-8 inline-flex h-12 items-center rounded-pill bg-surface-inverse px-7 type-label text-ink-inverse"
        >
          View design system
        </Link>
      </div>
    </main>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-gutter text-center">
      <div className="animate-rise-in">
        <p className="type-overline text-ink-muted">404</p>
        <h1 className="mt-3 type-display-lg">Not in stock</h1>
        <p className="mx-auto mt-3 max-w-xs type-body text-ink-muted">This page does not exist yet. The rest of the store does.</p>
        <Button asChild className="mt-8">
          <Link href="/">Back to the store</Link>
        </Button>
      </div>
    </main>
  )
}

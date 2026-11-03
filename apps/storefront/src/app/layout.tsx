import type { Metadata, Viewport } from "next"
import "./globals.css"

/*
 * Fonts: Amulya (display) + Synonym (body) by Indian Type Foundry,
 * served by Fontshare (free for commercial use).
 * To self-host later, download the woff2 files into src/app/fonts and
 * switch to next/font/local with the same family names.
 */
const FONTSHARE_CSS =
  "https://api.fontshare.com/v2/css?f[]=amulya@500,700&f[]=synonym@400,500,600&display=swap"

export const metadata: Metadata = {
  title: {
    default: "D-STORE",
    template: "%s | D-STORE",
  },
  description: "D-STORE clothing storefront",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={FONTSHARE_CSS} />
      </head>
      <body>{children}</body>
    </html>
  )
}

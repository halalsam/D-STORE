import { Suspense } from "react"
import { BagDrawer } from "@/components/store/bag-drawer"
import { BagSync } from "@/components/store/bag-sync"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader, SiteHeaderFallback } from "@/components/store/site-header"
import { getNavigation } from "@/lib/data/navigation"

async function Header() {
  return <SiteHeader nav={await getNavigation()} />
}

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <BagSync />
      <Suspense fallback={<SiteHeaderFallback />}>
        <Header />
      </Suspense>
      {children}
      <SiteFooter />
      <BagDrawer />
    </>
  )
}

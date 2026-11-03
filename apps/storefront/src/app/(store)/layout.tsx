import { Suspense } from "react"
import { BagDrawer } from "@/components/store/bag-drawer"
import { BagSync } from "@/components/store/bag-sync"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader, SiteHeaderFallback } from "@/components/store/site-header"

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <BagSync />
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      {children}
      <SiteFooter />
      <BagDrawer />
    </>
  )
}

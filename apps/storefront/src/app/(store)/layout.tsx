import { BagDrawer } from "@/components/store/bag-drawer"
import { BagProvider } from "@/components/store/bag-provider"
import { SiteFooter } from "@/components/store/site-footer"
import { SiteHeader } from "@/components/store/site-header"

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <BagProvider>
      <SiteHeader />
      {children}
      <SiteFooter />
      <BagDrawer />
    </BagProvider>
  )
}

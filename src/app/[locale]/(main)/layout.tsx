import { Footer } from "@/components/organisms/Footer/Footer"
import { Header } from "@/components/organisms/Header/Header"
import { PromotionalAdsModal } from "@/components/organisms/PromotionalAdsModal/PromotionalAdsModal"
import { getSessionCustomer } from "@/lib/data/customer"
import { checkRegion } from "@/lib/helpers/check-region"
import { redirect } from "next/navigation"

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  const [user, regionCheck] = await Promise.all([
    getSessionCustomer(),
    checkRegion(locale),
  ])

  if (!regionCheck) {
    return redirect("/")
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PromotionalAdsModal />
      <Header user={user} />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      <Footer />
    </div>
  )
}

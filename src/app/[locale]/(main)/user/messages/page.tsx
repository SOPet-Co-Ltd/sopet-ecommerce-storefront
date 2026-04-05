import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserMessagesSection } from "@/components/sections/UserMessagesSection/UserMessagesSection"
import { verifyCustomer } from "@/lib/data/customer"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/messages",
    title: "ข้อความ",
    description: "สนทนากับร้านค้าและติดตามข้อความที่เกี่ยวกับคำสั่งซื้อ",
    indexable: false,
  })
}

export default async function MessagesPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container px-sop-16px">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 space-y-8">
          <UserMessagesSection />
        </div>
      </div>
    </main>
  )
}

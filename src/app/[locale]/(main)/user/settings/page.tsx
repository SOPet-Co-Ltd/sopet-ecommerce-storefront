import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { ProfileDetails } from "@/components/molecules/ProfileDetails/ProfileDetails"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { ProfilePassword } from "@/components/molecules/ProfileDetails/ProfilePassword"
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
    pathname: "user/settings",
    title: "ตั้งค่าบัญชี",
    description: "อัปเดตข้อมูลส่วนตัวและรหัสผ่านของบัญชีคุณ",
    indexable: false,
  })
}

export default async function ReviewsPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container px-sop-16px">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <h1 className="heading-md uppercase mb-8">Settings</h1>
          <ProfileDetails user={user} />
          <ProfilePassword user={user} />
        </div>
      </div>
    </main>
  )
}

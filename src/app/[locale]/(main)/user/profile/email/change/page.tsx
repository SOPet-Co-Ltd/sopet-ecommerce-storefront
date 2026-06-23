import { ProfileContactOtpForm } from "@/components/molecules/ProfileContactOtpForm/ProfileContactOtpForm"
import { UserContainer } from "@/components/molecules/UserContainer/UserContainer"
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
    pathname: "user/profile/email/change",
    title: "เปลี่ยนอีเมล",
    description: "อัปเดตอีเมลเข้าสู่ระบบของบัญชีคุณ",
    indexable: false,
  })
}

export default async function ChangeEmailPage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เปลี่ยนอีเมล" showBackButton>
      <ProfileContactOtpForm
        type="email"
        mode="change"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

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
    pathname: "user/profile/email/add",
    title: "เพิ่มอีเมล",
    description: "ยืนยันและเพิ่มอีเมลสำหรับบัญชีของคุณ",
    indexable: false,
  })
}

export default async function AddEmailPage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เพิ่มอีเมล" showBackButton>
      <ProfileContactOtpForm
        type="email"
        mode="add"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

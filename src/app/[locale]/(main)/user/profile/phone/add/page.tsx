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
    pathname: "user/profile/phone/add",
    title: "เพิ่มเบอร์โทรศัพท์",
    description: "ยืนยันและเพิ่มเบอร์โทรสำหรับบัญชีของคุณ",
    indexable: false,
  })
}

export default async function AddPhonePage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เพิ่มเบอร์โทรศัพท์" showBackButton>
      <ProfileContactOtpForm
        type="phone"
        mode="add"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

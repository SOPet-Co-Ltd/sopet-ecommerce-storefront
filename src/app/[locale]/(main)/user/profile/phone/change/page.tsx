import { ProfileContactOtpForm, UserContainer } from "@/components/molecules"
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
    pathname: "user/profile/phone/change",
    title: "เปลี่ยนเบอร์โทรศัพท์",
    description: "อัปเดตเบอร์โทรที่เชื่อมกับบัญชีคุณ",
    indexable: false,
  })
}

export default async function ChangePhonePage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เปลี่ยนเบอร์โทรศัพท์" showBackButton>
      <ProfileContactOtpForm
        type="phone"
        mode="change"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

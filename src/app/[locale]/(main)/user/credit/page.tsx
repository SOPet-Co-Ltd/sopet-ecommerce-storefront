import { UserContainer } from "@/components/molecules/UserContainer/UserContainer"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { verifyCustomer } from "@/lib/data/customer"
import { CreditCards } from "@/components/organisms"
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
    pathname: "user/credit",
    title: "บัตรชำระเงิน",
    description: "จัดการบัตรเครดิตและเดบิตที่บันทึกไว้สำหรับการสั่งซื้อ",
    indexable: false,
  })
}

export default async function CreditPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  return (
    <UserContainer title="บัตรเครดิต/เดบิต">
      <CreditCards />
    </UserContainer>
  )
}

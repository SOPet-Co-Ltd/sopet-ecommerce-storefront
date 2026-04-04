import { UserContainer } from "@/components/molecules"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { CreditCardFormPage } from "@/components/molecules/CreditCardForm/CreditCardFormPage"
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
    pathname: "user/credit/add",
    title: "เพิ่มบัตรเครดิต/เดบิต",
    description: "บันทึกบัตรใหม่สำหรับชำระเงินอย่างรวดเร็วในครั้งถัดไป",
    indexable: false,
  })
}

export default async function AddCreditCardPage() {
  const user = await verifyCustomer()

  if (!user) {
    return <LoginForm />
  }

  return (
    <UserContainer title="เพิ่มบัตรเครดิต/เดบิต" showBackButton>
      <CreditCardFormPage customer={user} />
    </UserContainer>
  )
}

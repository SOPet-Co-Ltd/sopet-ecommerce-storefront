import { AddressFormPage } from "@/components/molecules/AddressForm/AddressFormPage"
import { UserContainer } from "@/components/molecules/UserContainer/UserContainer"
import { verifyCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/addresses/new",
    title: "เพิ่มที่อยู่",
    description: "เพิ่มที่อยู่จัดส่งใหม่สำหรับคำสั่งซื้อ",
    indexable: false,
  })
}

export default async function NewAddressPage() {
  const user = await verifyCustomer()
  const regions = await listRegions()

  if (!user) {
    redirect("/user")
  }

  return (
    <UserContainer title="ที่อยู่สำหรับจัดส่ง" showBackButton>
      <AddressFormPage regions={regions} />
    </UserContainer>
  )
}

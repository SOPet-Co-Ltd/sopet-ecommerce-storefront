import { UserContainer, UserNavigation } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"
import { Addresses } from "@/components/organisms"
import { listRegions } from "@/lib/data/regions"
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
    pathname: "user/addresses",
    title: "ที่อยู่จัดส่ง",
    description: "จัดการที่อยู่สำหรับจัดส่งคำสั่งซื้อของคุณ",
    indexable: false,
  })
}

export default async function Page() {
  const user = await verifyCustomer()
  const regions = await listRegions()

  if (!user) {
    redirect("/user")
  }

  return (
    <UserContainer title="ที่อยู่สำหรับจัดส่ง">
      <Addresses {...{ user, regions }} />
    </UserContainer>
  )
}

import { SellerTabs } from "@/components/organisms"
import { SellerPageHeader } from "@/components/sections"
import { verifyCustomer } from "@/lib/data/customer"
import { getRegion } from "@/lib/data/regions"
import { getSellerByHandle } from "@/lib/data/seller"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { SellerProps } from "@/types/seller"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}): Promise<Metadata> {
  const { handle, locale } = await params
  const raw = await getSellerByHandle(handle)
  const seller = Array.isArray(raw) ? null : (raw as SellerProps | null)

  if (!seller?.name) {
    return { title: "ไม่พบร้านค้า" }
  }

  const title = `รีวิวร้าน ${seller.name}`
  const description = `อ่านรีวิวจากลูกค้าสำหรับ ${seller.name} บน ${process.env.NEXT_PUBLIC_SITE_NAME || "SOPet"}`

  return buildPageMetadata({
    locale,
    pathname: `sellers/${handle}/reviews`,
    title,
    description,
    indexable: true,
  })
}

export default async function SellerReviewsPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  const seller = (await getSellerByHandle(handle)) as SellerProps
  const currency_code = (await getRegion(locale))?.currency_code || "usd"

  const user = await verifyCustomer()

  const tab = "reviews"

  return (
    <main className="container">
      <SellerPageHeader header seller={seller} user={user} />
      <SellerTabs
        tab={tab}
        seller_id={seller.id}
        seller_handle={seller.handle}
        locale={locale}
        currency_code={currency_code}
      />
    </main>
  )
}

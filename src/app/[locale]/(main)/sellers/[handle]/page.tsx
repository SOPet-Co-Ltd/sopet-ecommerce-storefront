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

  const site = process.env.NEXT_PUBLIC_SITE_NAME || "Sopet"
  const blurb =
    seller.description?.trim() ||
    `สินค้าและบริการจาก ${seller.name} บนแพลตฟอร์ม ${site}`

  return buildPageMetadata({
    locale,
    pathname: `sellers/${handle}`,
    title: seller.name,
    description: blurb.slice(0, 160),
    indexable: true,
  })
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  const seller = (await getSellerByHandle(handle)) as SellerProps

  const user = await verifyCustomer()

  const currency_code = (await getRegion(locale))?.currency_code || "usd"

  const tab = "products"

  if (!seller) {
    return null
  }

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

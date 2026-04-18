import OrdersPageClient from "@/app/[locale]/(main)/user/orders/OrdersPageClient"
import { getOrdersPageBundleData } from "@/lib/data/order-management-page"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/orders",
    title: "คำสั่งซื้อของฉัน",
    description: "ดูสถานะและประวัติคำสั่งซื้อทั้งหมดของคุณบน SOPet",
    indexable: false,
  })
}

export default async function UserPage() {
  const initialData = await getOrdersPageBundleData(100, 0)

  return <OrdersPageClient initialData={initialData} />
}

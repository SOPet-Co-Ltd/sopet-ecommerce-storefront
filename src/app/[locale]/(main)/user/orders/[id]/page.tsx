import OrderDetailsPageClient from "@/app/[locale]/(main)/user/orders/[id]/OrderDetailsPageClient"
import { getOrderDetailsPageBundleData } from "@/lib/data/order-management-page"
import { notFound } from "next/navigation"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPageMetadata({
    locale,
    pathname: `user/orders/${id}`,
    title: "รายละเอียดคำสั่งซื้อ",
    description:
      "ดูรายการสินค้า สถานะจัดส่ง และข้อมูลการชำระเงินของคำสั่งซื้อนี้",
    indexable: false,
  })
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const initialData = await getOrderDetailsPageBundleData(id)
  const order = initialData.order

  if (!order) {
    return notFound()
  }

  return <OrderDetailsPageClient orderId={id} initialData={initialData} />
}

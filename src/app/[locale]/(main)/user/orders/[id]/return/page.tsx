import { OrderReturnSection } from "@/components/sections/OrderReturnSection/OrderReturnSection"
import {
  retrieveOrder,
  retrieveReturnReasons,
  retriveReturnMethods,
} from "@/lib/data/orders"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { notFound } from "next/navigation"
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
    pathname: `user/orders/${id}/return`,
    title: "คืนสินค้า / ขอคืนเงิน",
    description: "กรอกคำขอคืนสินค้าหรือคืนเงินสำหรับคำสั่งซื้อนี้",
    indexable: false,
  })
}

export default async function ReturnOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const returnReasons = await retrieveReturnReasons()
  const returnMethods = await retriveReturnMethods(id)

  return (
    <main className="container">
      <OrderReturnSection
        order={order}
        returnReasons={returnReasons}
        shippingMethods={returnMethods}
      />
    </main>
  )
}

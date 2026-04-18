import { ClearCheckoutCartHold } from "@/components/sections/OrderConfirmedSection/ClearCheckoutCartHold"
import { OrderConfirmedSection } from "@/components/sections/OrderConfirmedSection/OrderConfirmedSection"
import { retrieveOrder } from "@/lib/data/orders"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ locale: string; id: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  return buildPageMetadata({
    locale,
    pathname: `order/${id}/confirmed`,
    title: "สั่งซื้อสำเร็จ",
    description:
      "ขอบคุณสำหรับการสั่งซื้อ คุณจะได้รับการยืนยันและสามารถตรวจสอบรายละเอียดคำสั่งซื้อได้ในบัญชีของคุณ",
    indexable: false,
  })
}

import { OrderConfirmedClient } from "./OrderConfirmedClient"

export default async function OrderConfirmedPage(props: Props) {
  const params = await props.params

  return <OrderConfirmedClient orderId={params.id} />
}

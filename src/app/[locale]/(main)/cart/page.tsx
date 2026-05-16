import { Cart } from "@/types/cart"
import { getCartForCustomerCartPage } from "@/lib/data/customer-cart-page"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { getSessionCustomer } from "@/lib/data/customer"
import { CartPageClient } from "./CartPageClient"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "cart",
    title: "ตะกร้าสินค้า",
    description:
      "ตรวจสอบสินค้าในตะกร้า ปรับจำนวน และดำเนินการชำระเงินเมื่อพร้อมบน Sopet",
    indexable: false,
  })
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const customer = await getSessionCustomer()
  const cart = customer ? await getCartForCustomerCartPage(locale) : null

  return (
    <CartPageClient
      initialCart={cart as Cart | null}
      locale={locale}
      cartSource={customer ? "customer" : "anonymous"}
    />
  )
}

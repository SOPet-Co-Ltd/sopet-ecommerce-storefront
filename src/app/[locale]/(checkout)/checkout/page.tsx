import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import CheckoutFlowClient from "@/components/sections/CheckoutPaymentSection/CheckoutFlowClient"

import {
  retrieveCart,
  ensureCheckoutCartQuantitiesCapped,
} from "@/lib/data/cart"
import { verifyCustomer } from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "checkout",
    title: "ชำระเงิน",
    description:
      "กรอกที่อยู่จัดส่ง เลือกวิธีชำระเงิน และยืนยันคำสั่งซื้อของคุณอย่างปลอดภัย",
    indexable: false,
  })
}

export default async function CheckoutPage() {
  let cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const capped = await ensureCheckoutCartQuantitiesCapped(cart)
  if (capped) {
    cart = capped
  }

  const regionId = cart.region_id ?? cart.region?.id

  const [shippingMethods, paymentMethods, customer] = await Promise.all([
    listCartShippingMethods(cart.id, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    verifyCustomer(),
  ])

  return (
    <PaymentWrapper cart={cart}>
      <main className="lg:px-16 px-0 lg:py-4 flex flex-col gap-4">
        <CheckoutFlowClient
          cart={cart}
          shippingMethods={shippingMethods || []}
          paymentMethods={paymentMethods}
          customer={customer}
        />
      </main>
    </PaymentWrapper>
  )
}

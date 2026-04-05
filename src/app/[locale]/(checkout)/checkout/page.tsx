import { CheckoutElementsSecretProvider } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { MarketplaceCheckoutProvider } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import { CheckoutCartCapRunner } from "@/components/sections/CheckoutPaymentSection/CheckoutCartCapRunner"
import CheckoutFlowClient from "@/components/sections/CheckoutPaymentSection/CheckoutFlowClient"

import { retrieveCart } from "@/lib/data/cart"
import { checkoutLineFingerprint } from "@/lib/helpers/checkout-line-fingerprint"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

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

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const cart = await retrieveCart()

  if (!cart) {
    redirect(`/${locale}/cart?checkout=unavailable`)
  }

  const lineFingerprint = checkoutLineFingerprint(cart)

  return (
    <CheckoutElementsSecretProvider>
      <MarketplaceCheckoutProvider>
        <main className="lg:px-16 px-0 lg:py-4 flex flex-col gap-4">
          <CheckoutFlowClient cart={cart} />
          <CheckoutCartCapRunner
            cartId={cart.id}
            lineFingerprint={lineFingerprint}
          />
        </main>
      </MarketplaceCheckoutProvider>
    </CheckoutElementsSecretProvider>
  )
}

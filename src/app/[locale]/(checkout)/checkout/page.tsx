import { CheckoutElementsSecretProvider } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { MarketplaceCheckoutProvider } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import { CheckoutCartCapRunner } from "@/components/sections/CheckoutPaymentSection/CheckoutCartCapRunner"
import CheckoutFlowClient from "@/components/sections/CheckoutPaymentSection/CheckoutFlowClient"

import { retrieveCart, setMultiShippingMethods } from "@/lib/data/cart"
import { getCheckoutPageInitialData } from "@/lib/data/checkout-page"
import { getCheckoutCustomer } from "@/lib/data/customer"
import { buildCartDefaultShippingSelection } from "@/lib/helpers/cart-shipping-selection"
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
  const customerPromise = getCheckoutCustomer()
  let cart = await retrieveCart()

  if (!cart) {
    redirect(`/${locale}/cart?checkout=unavailable`)
  }

  const regionId = cart.region_id ?? cart.region?.id ?? null
  const initialData = await getCheckoutPageInitialData(cart.id, regionId, {
    customerPromise,
  })
  const shippingAutoSelection = buildCartDefaultShippingSelection(
    cart,
    initialData.shippingMethods
  )

  if (shippingAutoSelection.needsPersist && shippingAutoSelection.optionIds.length) {
    await setMultiShippingMethods({
      cartId: cart.id,
      optionIds: shippingAutoSelection.optionIds,
    }, {
      skipCacheRevalidate: true,
    })

    const updatedCart = await retrieveCart(cart.id)
    if (updatedCart) {
      cart = updatedCart
    }
  }

  const lineFingerprint = checkoutLineFingerprint(cart)

  return (
    <CheckoutElementsSecretProvider>
      <MarketplaceCheckoutProvider>
        <main className="lg:px-16 px-0 lg:py-4 flex flex-col gap-4">
          <CheckoutFlowClient cart={cart} initialData={initialData} />
          <CheckoutCartCapRunner
            cartId={cart.id}
            lineFingerprint={lineFingerprint}
          />
        </main>
      </MarketplaceCheckoutProvider>
    </CheckoutElementsSecretProvider>
  )
}

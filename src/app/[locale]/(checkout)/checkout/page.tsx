import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartPaymentSection from "@/components/sections/CartPaymentSection/CartPaymentSection"
import CartReview from "@/components/sections/CartReview/CartReview"

import CartShippingMethodsSection from "@/components/sections/CartShippingMethodsSection/CartShippingMethodsSection"
import { retrieveCart } from "@/lib/data/cart"
import { retrieveCustomer } from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { retrieveRegion } from "@/lib/data/regions"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Checkout",
  description: "My cart page - Checkout",
}

export default async function CheckoutPage({}) {
  return (
    <Suspense
      fallback={
        <div className="container flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}

async function CheckoutPageContent({}) {
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const shippingMethods = await listCartShippingMethods(cart.id, false)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  const customer = await retrieveCustomer()

  return (
    <PaymentWrapper cart={cart}>
      <main className="container">
        <div className="flex w-full">
          <div className="flex flex-col gap-4">
            <CartAddressSection cart={cart} customer={customer} />
            <CartShippingMethodsSection
              cart={cart}
              availableShippingMethods={shippingMethods}
            />
            <CartReview cart={cart} />

            <CartPaymentSection
              cart={cart}
              availablePaymentMethods={paymentMethods}
            />
          </div>
        </div>
      </main>
    </PaymentWrapper>
  )
}

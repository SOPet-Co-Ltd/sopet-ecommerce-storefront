import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import CheckoutFlowClient from "@/components/sections/CheckoutPaymentSection/CheckoutFlowClient"

import {
  retrieveCart,
  ensureCheckoutCartQuantitiesCapped,
} from "@/lib/data/cart"
import {
  listAddressesByPhone,
  retrieveCustomer,
  verifyCustomer,
} from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
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
  let cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const capped = await ensureCheckoutCartQuantitiesCapped(cart)
  if (capped) {
    cart = capped
  }

  const shippingMethods = await listCartShippingMethods(cart.id, false)

  const regionId = cart.region_id ?? cart.region?.id
  const paymentMethods = regionId
    ? await listCartPaymentMethods(regionId)
    : null

  // const customer = await retrieveCustomer()
  const customer = await verifyCustomer()

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

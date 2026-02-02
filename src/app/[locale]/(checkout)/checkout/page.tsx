import PaymentWrapper from "@/components/organisms/PaymentContainer/PaymentWrapper"
import CheckoutFlowClient from "@/components/sections/CheckoutPaymentSection/CheckoutFlowClient"

import { retrieveCart } from "@/lib/data/cart"
import { listAddressesByPhone, retrieveCustomer } from "@/lib/data/customer"
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
  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  const shippingMethods = await listCartShippingMethods(cart.id, false)

  const regionId = cart.region_id ?? cart.region?.id
  const paymentMethods = regionId
    ? await listCartPaymentMethods(regionId)
    : null

  const customer = await retrieveCustomer()
  const cookieStore = await cookies()
  const hasAuthToken = Boolean(cookieStore.get("_medusa_jwt")?.value)
  const fallbackPhone = customer?.phone || ""

  const phoneAddresses =
    !customer?.addresses?.length && fallbackPhone
      ? await listAddressesByPhone(fallbackPhone)
      : []

  return (
    <PaymentWrapper cart={cart}>
      <main className="">
        <div className="flex w-full justify-center py-10">
          <div className="flex flex-col gap-4 w-full max-w-4xl">
            <CheckoutFlowClient
              cart={cart}
              shippingMethods={shippingMethods || []}
              paymentMethods={paymentMethods}
              customer={customer}
              phoneAddresses={phoneAddresses}
              hasAuthToken={hasAuthToken}
            />
          </div>
        </div>
      </main>
    </PaymentWrapper>
  )
}

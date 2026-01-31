"use client"

import { CheckoutPaymentProvider } from "./CheckoutPaymentContext"
import { CheckoutPaymentSection } from "./CheckoutPaymentSection"
import { CheckoutSummarySection } from "@/components/sections/CheckoutSummarySection"
import { CheckoutDiscountSection } from "@/components/sections/CheckoutDiscountSection/CheckoutDiscountSection"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartReview from "@/components/sections/CartReview/CartReview"
import { Cart, StoreCardShippingMethod } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"

type CheckoutFlowClientProps = {
  cart: Cart
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  phoneAddresses: HttpTypes.StoreCustomerAddress[]
  guestPhone?: string | null
}

export default function CheckoutFlowClient({
  cart,
  shippingMethods,
  paymentMethods,
  customer,
  phoneAddresses,
  guestPhone,
}: CheckoutFlowClientProps) {
  return (
    <CheckoutPaymentProvider>
      <CartAddressSection
        cart={cart}
        customer={customer}
        phoneAddresses={phoneAddresses}
        guestPhone={guestPhone}
      />

      <CartReview
        cart={cart}
        shippingMethods={shippingMethods}
        customer={customer}
      />

      <CheckoutDiscountSection cart={cart} />

      <CheckoutPaymentSection cart={cart} paymentMethods={paymentMethods} />

      <CheckoutSummarySection cart={cart} customer={customer} />
    </CheckoutPaymentProvider>
  )
}

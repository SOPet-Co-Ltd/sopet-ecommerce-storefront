"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { CheckoutPaymentProvider } from "./CheckoutPaymentContext"
import { CheckoutPaymentSection } from "./CheckoutPaymentSection"
import { CheckoutSummarySection } from "@/components/sections/CheckoutSummarySection"
import { CheckoutDiscountSection } from "@/components/sections/CheckoutDiscountSection/CheckoutDiscountSection"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartReview from "@/components/sections/CartReview/CartReview"
import { GuestOTPDialog } from "@/components/organisms/GuestOTPDialog/GuestOTPDialog"
import { Cart, StoreCardShippingMethod } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"

type CheckoutFlowClientProps = {
  cart: Cart
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  phoneAddresses: HttpTypes.StoreCustomerAddress[]
  hasAuthToken?: boolean
}

export default function CheckoutFlowClient({
  cart,
  shippingMethods,
  paymentMethods,
  customer,
  phoneAddresses,
  hasAuthToken = false,
}: CheckoutFlowClientProps) {
  const router = useRouter()
  const [isOTPVerified, setIsOTPVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")

  const showGuestOTPDialog = !hasAuthToken && !customer && !isOTPVerified

  const handleGuestVerified = useCallback(
    (phone: string) => {
      setVerifiedPhone(phone)
      setIsOTPVerified(true)
      router.refresh()
    },
    [router]
  )

  return (
    <CheckoutPaymentProvider>
      <GuestOTPDialog
        isOpen={showGuestOTPDialog}
        onVerified={handleGuestVerified}
      />

      <CartAddressSection
        cart={cart}
        customer={customer}
        phoneAddresses={phoneAddresses}
        verifiedPhone={verifiedPhone}
      />

      <CartReview
        cart={cart}
        shippingMethods={shippingMethods}
        customer={customer}
      />

      <CheckoutDiscountSection cart={cart} />

      <CheckoutPaymentSection
        cart={cart}
        customer={customer}
        paymentMethods={paymentMethods}
        shippingMethods={shippingMethods}
      />

      <CheckoutSummarySection
        cart={cart}
        customer={customer}
        shippingMethods={shippingMethods}
        paymentMethods={paymentMethods}
      />
    </CheckoutPaymentProvider>
  )
}

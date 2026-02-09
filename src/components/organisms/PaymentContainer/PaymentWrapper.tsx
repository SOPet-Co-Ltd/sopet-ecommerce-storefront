"use client"

import { loadStripe } from "@stripe/stripe-js"
import React from "react"
import StripeWrapper from "./StripeWrapper"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"

type PaymentWrapperProps = {
  cart: Cart
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s: HttpTypes.StorePaymentSession) => s.status === "pending"
  )

  if (stripePromise) {
    return (
      <StripeWrapper
        paymentSession={paymentSession}
        stripeKey={stripeKey}
        stripePromise={stripePromise}
      >
        {children}
      </StripeWrapper>
    )
  }

  return <>{children}</>
}

export default PaymentWrapper

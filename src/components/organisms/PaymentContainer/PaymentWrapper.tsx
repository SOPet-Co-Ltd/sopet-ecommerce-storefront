"use client"

import { RouteLoadingSpinnerBlock } from "@/components/atoms/RouteLoadingFallback/RouteLoadingSpinnerBlock"
import { loadStripe } from "@stripe/stripe-js"
import React, { useEffect, useState } from "react"
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

  const [stripeBootReady, setStripeBootReady] = useState(!stripePromise)

  useEffect(() => {
    if (!stripePromise) return
    stripePromise.finally(() => {
      setStripeBootReady(true)
    })
  }, [])

  useEffect(() => {
    if (stripeBootReady) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [stripeBootReady])

  if (!stripeBootReady) {
    return (
      <div
        className="fixed inset-0 z-99980 flex flex-col items-center justify-center gap-4 bg-sop-base-white/96 backdrop-blur-sm px-6"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <RouteLoadingSpinnerBlock variant="compact" />
      </div>
    )
  }

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

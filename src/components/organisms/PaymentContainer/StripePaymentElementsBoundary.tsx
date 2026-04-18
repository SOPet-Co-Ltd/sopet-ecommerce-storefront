"use client"

import { useCheckoutElementsSecret } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import {
  getStripePromise,
  getStripePublishableKey,
} from "@/lib/stripe/get-stripe"
import type { Cart } from "@/types/cart"
import { isOrderPaymentSessionSelectableForCheckout } from "@/lib/helpers/order-checkout-payment"
import type { HttpTypes } from "@medusajs/types"
import { useMemo, type ReactNode } from "react"
import StripeWrapper from "./StripeWrapper"

/**
 * Wraps only the subtree that needs Stripe Elements (payment + pay actions).
 * Keeps address/shipping/review outside so changing client_secret does not remount them.
 */
export function StripePaymentElementsBoundary({
  cart,
  children,
}: {
  cart: Cart
  children: ReactNode
}) {
  const contextSecret = useCheckoutElementsSecret(
    (state) => state.clientSecret
  )

  const sessionFromCart = cart.payment_collection?.payment_sessions?.find(
    (s: HttpTypes.StorePaymentSession) =>
      isOrderPaymentSessionSelectableForCheckout(String(s.status))
  )

  const effectiveSecret =
    contextSecret ??
    (sessionFromCart?.data?.client_secret as string | undefined)

  const paymentSession: HttpTypes.StorePaymentSession | undefined =
    useMemo(() => {
      if (effectiveSecret) {
        return {
          ...(sessionFromCart ?? {}),
          data: {
            ...(typeof sessionFromCart?.data === "object"
              ? sessionFromCart?.data
              : {}),
            client_secret: effectiveSecret,
          },
          provider_id:
            sessionFromCart?.provider_id ?? "pp_stripe-connect-unified_stripe",
        } as HttpTypes.StorePaymentSession
      }
      return sessionFromCart
    }, [effectiveSecret, sessionFromCart])

  const stripePromise = getStripePromise()
  const stripeKey = getStripePublishableKey()

  if (!stripePromise || !stripeKey) {
    return <>{children}</>
  }

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

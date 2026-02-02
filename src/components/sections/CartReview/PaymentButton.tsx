"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { isManual, isStripe } from "../../../lib/constants"
import { placeOrder, setShippingMethod } from "@/lib/data/cart"
import { CardElement, CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js"
import React, { useEffect, useState } from "react"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { HttpTypes } from "@medusajs/types"

type PaymentButtonProps = {
  cart: Cart
  customer?: HttpTypes.StoreCustomer | null
  "data-testid": string
}

  const isStripeProvider = (providerId?: string) =>
    providerId === "stripe" || isStripe(providerId)

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  customer,
  "data-testid": dataTestId,
}) => {
  const { selectedAddress, selectedEmail } = useCheckoutPayment()
  const fallbackAddress:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null =
    cart.billing_address || cart.shipping_address || selectedAddress || null
  const fallbackEmail =
    cart.email || customer?.email || selectedEmail || ""
  const notReady =
    !cart ||
    !fallbackAddress

  const stripeSession = cart.payment_collection?.payment_sessions?.find(
    (session) => isStripeProvider(session.provider_id)
  )
  const paymentSession =
    stripeSession || cart.payment_collection?.payment_sessions?.[0]
  const pendingShippingOptionKey = `checkout:selected_shipping_option:${cart.id}`

  const syncShippingMethodBeforePayment = async () => {
    if (typeof window === "undefined") return

    const selectedOptionId = window.localStorage.getItem(pendingShippingOptionKey)
    if (!selectedOptionId) return

    const alreadySelected = (cart.shipping_methods || []).some(
      (method) => method.shipping_option_id === selectedOptionId
    )
    if (alreadySelected) return

    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: selectedOptionId,
    })
  }

  switch (true) {
    case isStripeProvider(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          billingAddress={fallbackAddress}
          email={fallbackEmail}
          syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton
          notReady={notReady}
          syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
          data-testid={dataTestId}
        />
      )
    default:
      return (
        <Button disabled className="w-full">
          Select a payment method
        </Button>
      )
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  billingAddress,
  email,
  syncShippingMethodBeforePayment,
  "data-testid": dataTestId,
}: {
  cart: Cart
  notReady: boolean
  billingAddress?: 
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  email?: string
  syncShippingMethodBeforePayment: () => Promise<void>
  "data-testid"?: string
}) => {
  const { cardComplete } = useCheckoutPayment()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(true)

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder()
      if (!res.ok) {
        setErrorMessage(res.error?.message)
      }
    } catch (error: any) {
      if (error?.message !== "NEXT_REDIRECT") {
        setErrorMessage(
          error?.message?.replace("Error setting up the request: ", "")
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const stripe = useStripe()
  const elements = useElements()
  const cardNumberElement = elements?.getElement(CardNumberElement)
  const card =
    cardNumberElement || elements?.getElement(CardElement)

  const session =
    cart.payment_collection?.payment_sessions?.find((s) =>
      isStripeProvider(s.provider_id)
    ) || cart.payment_collection?.payment_sessions?.[0]

  useEffect(() => {
    if (cardNumberElement) {
      setDisabled(!cardComplete)
      return
    }

    //@ts-ignore
    setDisabled(!card?._complete)
  }, [cardComplete, cardNumberElement, card])

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    try {
      await syncShippingMethodBeforePayment()
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to set shipping method")
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session?.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address?.first_name +
              " " +
              cart.billing_address?.last_name,
            address: {
              city: billingAddress?.city ?? undefined,
              country: billingAddress?.country_code ?? undefined,
              line1: billingAddress?.address_1 ?? undefined,
              line2: billingAddress?.address_2 ?? undefined,
              postal_code: billingAddress?.postal_code ?? undefined,
              state: billingAddress?.province ?? undefined,
            },
            email: email || undefined,
            phone: billingAddress?.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        loading={submitting}
        className="w-full"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

const ManualTestPaymentButton = ({
  notReady,
  syncShippingMethodBeforePayment,
}: {
  notReady: boolean
  syncShippingMethodBeforePayment: () => Promise<void>
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    try {
      const res = await placeOrder()
      if (!res.ok) {
        setErrorMessage(res.error?.message)
      }
    } catch (error: any) {
      if (error?.message !== "NEXT_REDIRECT") {
        setErrorMessage(
          error?.message?.replace("Error setting up the request: ", "")
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handlePayment = async () => {
    setSubmitting(true)
    try {
      await syncShippingMethodBeforePayment()
      await onPaymentCompleted()
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to set shipping method")
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        disabled={notReady}
        onClick={handlePayment}
        className="w-full"
        loading={submitting}
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </>
  )
}

export default PaymentButton

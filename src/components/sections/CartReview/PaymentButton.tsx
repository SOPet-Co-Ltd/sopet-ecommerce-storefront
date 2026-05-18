"use client"

import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import { isManual } from "../../../lib/constants"
import { placeOrder, setShippingMethod } from "@/lib/data/cart"
import React, { useState } from "react"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { HttpTypes } from "@medusajs/types"

type PaymentButtonProps = {
  cart: Cart
  customer?: HttpTypes.StoreCustomer | null
  "data-testid": string
}

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
  const notReady = !cart || !fallbackAddress

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]
  const pendingShippingOptionKey = `checkout:selected_shipping_option:${cart.id}`

  const syncShippingMethodBeforePayment = async () => {
    if (typeof window === "undefined") return
    const selectedOptionId = window.localStorage.getItem(
      pendingShippingOptionKey
    )
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

  if (isManual(paymentSession?.provider_id)) {
    return (
      <ManualTestPaymentButton
        notReady={notReady}
        syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
        data-testid={dataTestId}
      />
    )
  }

  return (
    <Button disabled className="w-full">
      Select a payment method
    </Button>
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

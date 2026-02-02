"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/helpers/money"
import { Text } from "@medusajs/ui"
import { placeOrder, setShippingMethod } from "@/lib/data/cart"
import { useContext, useEffect, useState } from "react"
import {
  CardElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { StripeContext } from "@/components/organisms/PaymentContainer/StripeWrapper"
import { isStripe } from "@/lib/constants"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"

type CheckoutSummarySectionProps = {
  cart: Cart | null
  customer?: HttpTypes.StoreCustomer | null
  shippingMethods?: { id: string; amount?: number }[] | null
}

export const CheckoutSummarySection = ({
  cart,
  customer,
  shippingMethods,
}: CheckoutSummarySectionProps) => {
  const {
    method,
    cardholderName,
    cardComplete,
    cardError,
    selectedAddress,
    selectedEmail,
  } = useCheckoutPayment()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedShippingAmount, setSelectedShippingAmount] = useState(0)
  const stripeReady = useContext(StripeContext)

  if (!cart) return null

  const subtotal = cart.subtotal || 0
  const shippingTotal = selectedShippingAmount
  const discountTotal = cart.discount_total || 0
  const total = subtotal + shippingTotal - discountTotal
  const currencyCode = cart.currency_code || "thb"
  const pendingShippingOptionKey = `checkout:selected_shipping_option:${cart.id}`

  const syncShippingMethodBeforePayment = async () => {
    if (typeof window === "undefined") return

    const selectedOptionId =
      window.localStorage.getItem(pendingShippingOptionKey) ||
      cart.shipping_methods?.[0]?.shipping_option_id ||
      ""

    if (!selectedOptionId) {
      throw new Error("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน")
    }

    const alreadySelected = (cart.shipping_methods || []).some(
      (method) => method.shipping_option_id === selectedOptionId
    )
    if (alreadySelected) return

    await setShippingMethod({
      cartId: cart.id,
      shippingMethodId: selectedOptionId,
    })
  }

  useEffect(() => {
    const key = `checkout:selected_shipping_option:${cart.id}`

    const updateShippingAmount = (optionId?: string | null) => {
      const selectedId =
        optionId || window.localStorage.getItem(key) || cart.shipping_methods?.[0]?.shipping_option_id

      if (!selectedId) {
        setSelectedShippingAmount(cart.shipping_total || 0)
        return
      }

      const selected = (shippingMethods || []).find((sm) => sm.id === selectedId)
      setSelectedShippingAmount(selected?.amount || 0)
    }

    const onShippingOptionSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ cartId?: string; optionId?: string }>
      if (customEvent.detail?.cartId !== cart.id) return
      updateShippingAmount(customEvent.detail?.optionId)
    }

    updateShippingAmount()
    window.addEventListener("checkout:shipping-option-selected", onShippingOptionSelected)

    return () => {
      window.removeEventListener("checkout:shipping-option-selected", onShippingOptionSelected)
    }
  }, [cart.id, cart.shipping_methods, cart.shipping_total, shippingMethods])

  const isStripeProvider = (providerId?: string) =>
    providerId === "stripe" || isStripe(providerId)

  const stripeSession = cart.payment_collection?.payment_sessions?.find(
    (session) => isStripeProvider(session.provider_id)
  )
  const manualSession = cart.payment_collection?.payment_sessions?.find(
    (session) => !isStripeProvider(session.provider_id)
  )
  const paymentSession = method === "card" ? stripeSession : manualSession
  const stripeSessionReady = method === "card" && Boolean(stripeSession)

  const clientSecret = stripeSession?.data?.client_secret as string | undefined

  const fallbackAddress: HttpTypes.StoreCartAddress | null =
    (cart.billing_address ||
      cart.shipping_address ||
      selectedAddress ||
      null) as HttpTypes.StoreCartAddress | null
  const fallbackEmail = cart?.email || customer?.email || selectedEmail || ""
  const notReady = !cart || !fallbackAddress

  const disabledBase = submitting || notReady

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="flex flex-col gap-4 w-full md:w-1/2 ml-auto">
        <div className="flex justify-between items-center text-gray-900">
          <Text className="font-normal">รายการสั่งซื้อทั้งหมด</Text>
          <Text className="font-medium">
            {convertToLocale({
              amount: subtotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        <div className="flex justify-between items-center text-gray-900">
          <Text className="font-normal">ค่าจัดส่ง</Text>
          <Text className="font-medium">
            {convertToLocale({
              amount: shippingTotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <Text className="font-normal">ส่วนลด</Text>
            <Text className="font-medium">
              -{" "}
              {convertToLocale({
                amount: discountTotal,
                currency_code: currencyCode,
              })}
            </Text>
          </div>
        )}

        <div className="border-b border-gray-100 my-2" />

        <div className="flex justify-between items-center">
          <Text className="font-normal text-gray-900">ยอดชำระเงินทั้งหมด</Text>
          <div className="bg-red-400 text-white px-4 py-1 rounded-xl font-bold text-lg shadow-sm">
            {convertToLocale({
              amount: total,
              currency_code: currencyCode,
            })}
          </div>
        </div>

        {method === "card" ? (
          stripeReady ? (
            <>
              <StripeSummaryPayButton
                cart={cart}
                clientSecret={clientSecret}
                cardholderName={cardholderName}
                billingAddress={fallbackAddress}
                email={fallbackEmail}
                syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
                disabled={
                  disabledBase ||
                  !stripeSessionReady ||
                  !clientSecret ||
                  !cardComplete
                }
                submitting={submitting}
                setSubmitting={setSubmitting}
                setError={setError}
              />
            </>
          ) : (
            <Button
              className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full py-3 h-auto text-lg font-bold mt-4 shadow-md transition-all"
              disabled
            >
              Loading Stripe...
            </Button>
          )
        ) : (
          <ManualSummaryPayButton
            disabled={disabledBase}
            submitting={submitting}
            setSubmitting={setSubmitting}
            setError={setError}
            syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
          />
        )}
        {cardError && (
          <Text className="text-red-500 text-center text-sm">{cardError}</Text>
        )}
        {error && (
          <Text className="text-red-500 text-center text-sm">{error}</Text>
        )}
      </div>
    </div>
  )
}

const StripeSummaryPayButton = ({
  cart,
  clientSecret,
  cardholderName,
  billingAddress,
  email,
  syncShippingMethodBeforePayment,
  disabled,
  submitting,
  setSubmitting,
  setError,
}: {
  cart: Cart
  clientSecret?: string
  cardholderName: string
  billingAddress?:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  email?: string
  syncShippingMethodBeforePayment: () => Promise<void>
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
}) => {
  const stripe = useStripe()
  const elements = useElements()

  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
      await syncShippingMethodBeforePayment()

      // If already authorized, just complete the order
      if (cart.payment_collection?.status === "authorized") {
        await placeOrder()
        return
      }

      if (!stripe || !elements) {
        throw new Error("ระบบชำระเงินยังไม่พร้อมใช้งาน")
      }

      if (!clientSecret) {
        throw new Error("ยังไม่มีการตั้งค่าการชำระเงินด้วยบัตร")
      }

      const cardElement =
        elements.getElement(CardNumberElement) ||
        elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("กรุณากรอกรายละเอียดบัตรให้ครบถ้วน")
      }

      const billingNameFromCart = [
        billingAddress?.first_name,
        billingAddress?.last_name,
      ]
        .filter(Boolean)
        .join(" ")

      const billingName =
        cardholderName?.trim() || billingNameFromCart || undefined

      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: billingName,
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

      if (stripeError) {
        const pi = stripeError.payment_intent
        if (
          (pi && pi.status === "requires_capture") ||
          (pi && pi.status === "succeeded")
        ) {
          await placeOrder()
          return
        }

        throw new Error(stripeError.message || "Payment failed")
      }

      if (
        (paymentIntent && paymentIntent.status === "requires_capture") ||
        paymentIntent?.status === "succeeded"
      ) {
        await placeOrder()
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Button
      className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full py-3 h-auto text-lg font-bold mt-4 shadow-md transition-all"
      onClick={handlePayment}
      loading={submitting}
      disabled={disabled}
    >
      ชำระเงิน
    </Button>
  )
}

const ManualSummaryPayButton = ({
  disabled,
  submitting,
  setSubmitting,
  setError,
  syncShippingMethodBeforePayment,
}: {
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
  syncShippingMethodBeforePayment: () => Promise<void>
}) => {
  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
      await syncShippingMethodBeforePayment()
      await placeOrder()
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Button
      className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-full py-3 h-auto text-lg font-bold mt-4 shadow-md transition-all"
      onClick={handlePayment}
      loading={submitting}
      disabled={disabled}
    >
      ชำระเงิน
    </Button>
  )
}

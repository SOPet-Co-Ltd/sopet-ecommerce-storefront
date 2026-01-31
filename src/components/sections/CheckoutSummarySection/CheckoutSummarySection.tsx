"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/helpers/money"
import { Text } from "@medusajs/ui"
import { placeOrder } from "@/lib/data/cart"
import { useContext, useState } from "react"
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
}

export const CheckoutSummarySection = ({
  cart,
  customer,
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
  const stripeReady = useContext(StripeContext)

  if (!cart) return null

  const subtotal = cart.subtotal || 0
  const shippingTotal = cart.shipping_total || 0
  const discountTotal = cart.discount_total || 0
  const total = cart.total || subtotal + shippingTotal - discountTotal
  const currencyCode = cart.currency_code || "thb"

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
}: {
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
}) => {
  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
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

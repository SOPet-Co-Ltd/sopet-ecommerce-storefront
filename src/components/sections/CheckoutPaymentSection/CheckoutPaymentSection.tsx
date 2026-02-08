"use client"

import { useCallback, useEffect, useRef } from "react"
import { Wallet, Plus, Check } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { isStripe } from "@/lib/constants"
import { useCheckoutPayment } from "./CheckoutPaymentContext"
import { getCustomerPaymentMethods } from "@/lib/data/customer"
import { CreditCardCheckoutForm } from "@/components/molecules/CreditCardForm/CreditCardCheckoutForm"

type CheckoutPaymentSectionProps = {
  cart: Cart | null
  customer: HttpTypes.StoreCustomer | null
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  shippingMethods: { id: string }[]
}

const cardBrandLabel: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
}

export const CheckoutPaymentSection = ({
  cart,
  customer,
}: CheckoutPaymentSectionProps) => {
  const {
    method,
    setMethod,
    setCardComplete,
    savedPaymentMethods,
    setSavedPaymentMethods,
    selectedPaymentMethodId,
    setSelectedPaymentMethodId,
    useNewCard,
    setUseNewCard,
  } = useCheckoutPayment()
  const selectedPmIdRef = useRef<string | null>(null)
  selectedPmIdRef.current = selectedPaymentMethodId

  const isStripeProvider = (providerId?: string) => isStripe(providerId)

  const stripeSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => isStripeProvider(session.provider_id)
  )
  const promptpaySession = cart?.payment_collection?.payment_sessions?.find(
    (session) => session.provider_id?.toLowerCase().includes("promptpay")
  )
  const nonStripeSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => !isStripeProvider(session.provider_id)
  )

  // Fetch saved payment methods when customer exists and method is card
  useEffect(() => {
    if (method !== "card" || !customer) {
      return
    }
    getCustomerPaymentMethods().then((result) => {
      if (result.success) {
        setSavedPaymentMethods(result.paymentMethods)
        const currentId = selectedPmIdRef.current
        const stillValid =
          result.paymentMethods.length > 0 &&
          result.paymentMethods.some((pm) => pm.id === currentId)
        if (!stillValid && result.paymentMethods.length > 0) {
          const defaultPm =
            result.paymentMethods.find((pm) => pm.is_default) ||
            result.paymentMethods[0]
          if (defaultPm) setSelectedPaymentMethodId(defaultPm.id)
        }
      } else {
        setSavedPaymentMethods([])
        setSelectedPaymentMethodId(null)
      }
    })
  }, [method, customer, setSavedPaymentMethods, setSelectedPaymentMethodId])

  useEffect(() => {
    if (!cart?.payment_collection?.payment_sessions?.length) {
      return
    }

    const storageKey = `checkout:selected_payment_method:${cart.id}`
    const selectedFromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null

    if (selectedFromStorage === "qrcode" || selectedFromStorage === "card") {
      setMethod(selectedFromStorage)
      return
    }

    if (promptpaySession) {
      setMethod("qrcode")
      return
    }

    if (stripeSession) {
      setMethod("card")
      return
    }

    if (nonStripeSession) {
      setMethod("qrcode")
    }
  }, [cart, nonStripeSession, promptpaySession, setMethod, stripeSession])

  const showNewCardForm = useNewCard || savedPaymentMethods.length === 0

  useEffect(() => {
    setCardComplete(method === "card" && Boolean(selectedPaymentMethodId))
  }, [method, selectedPaymentMethodId, setCardComplete])

  const handleMethodChange = useCallback(
    (newMethod: "qrcode" | "card") => {
      setMethod(newMethod)
      if (cart && typeof window !== "undefined") {
        window.localStorage.setItem(
          `checkout:selected_payment_method:${cart.id}`,
          newMethod
        )
      }
      if (newMethod !== "card") {
        setUseNewCard(false)
      }
    },
    [cart, setMethod, setUseNewCard]
  )

  const handleNewCardSuccess = useCallback(() => {
    getCustomerPaymentMethods().then((result) => {
      if (result.success && result.paymentMethods.length > 0) {
        setSavedPaymentMethods(result.paymentMethods)
        const defaultPm =
          result.paymentMethods.find((pm) => pm.is_default) ||
          result.paymentMethods[0]
        if (defaultPm) setSelectedPaymentMethodId(defaultPm.id)
        setUseNewCard(false)
      }
    })
  }, [setSavedPaymentMethods, setSelectedPaymentMethodId, setUseNewCard])

  return (
    <div className="bg-white p-6 flex flex-col gap-6 relative">
      <div className="flex items-center gap-2 border-b border-sop-neutral-gray-light pb-4">
        <Wallet className="w-6 h-6 text-sop-primary-500" />
        <Heading level="h2" className="text-xl text-sop-primary-500 font-bold">
          วิธีการชำระเงิน
        </Heading>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="flex items-start gap-3 cursor-pointer"
          onClick={() => handleMethodChange("qrcode")}
        >
          <div
            className={clx(
              "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5",
              method === "qrcode" ? "border-purple-600" : "border-gray-300"
            )}
          >
            {method === "qrcode" && (
              <div className="w-3 h-3 rounded-full bg-purple-600" />
            )}
          </div>
          <Text className="text-gray-900 font-medium">QR Code</Text>
        </div>

        <div className="flex flex-col gap-3">
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => handleMethodChange("card")}
          >
            <div
              className={clx(
                "w-5 h-5 rounded-full border flex items-center justify-center mt-0.5",
                method === "card" ? "border-purple-600" : "border-gray-300"
              )}
            >
              {method === "card" && (
                <div className="w-3 h-3 rounded-full bg-purple-600" />
              )}
            </div>
            <Text className="text-gray-900 font-medium">
              บัตรเครดิต/บัตรเดบิต
            </Text>
          </div>

          {method === "card" && (
            <div className="pl-8 flex flex-col gap-4">
              {!showNewCardForm ? (
                <>
                  {savedPaymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className={clx(
                        "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                        selectedPaymentMethodId === pm.id
                          ? "border-purple-600 bg-purple-50"
                          : "border-sop-neutral-gray-light hover:bg-gray-50"
                      )}
                      onClick={() => setSelectedPaymentMethodId(pm.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-5 bg-orange-100 rounded flex items-center justify-center relative overflow-hidden">
                          <div className="w-4 h-4 rounded-full bg-red-500 opacity-80 -mr-2 z-10" />
                          <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80" />
                        </div>
                        <Text className="text-gray-700">
                          {cardBrandLabel[pm.brand ?? ""] ?? pm.brand ?? "Card"}{" "}
                          ****{pm.last4 ?? "****"}
                        </Text>
                      </div>
                      {selectedPaymentMethodId === pm.id && (
                        <Check className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                  ))}

                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => setUseNewCard(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        <p>เพิ่มบัตรใหม่</p>
                      </div>
                    </Button>
                  </div>
                </>
              ) : (
                <CreditCardCheckoutForm onSuccess={handleNewCardSuccess} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

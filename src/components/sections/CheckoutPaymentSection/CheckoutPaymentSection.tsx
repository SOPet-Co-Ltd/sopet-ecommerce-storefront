"use client"

import { useCallback, useEffect, useMemo } from "react"
import { Wallet, Plus } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { useCheckoutPayment } from "./CheckoutPaymentContext"
import { useCheckoutElementsSecret } from "./CheckoutElementsSecretContext"
import { CreditCardCheckoutForm } from "@/components/molecules/CreditCardForm/CreditCardCheckoutForm"
import { useCheckoutPageData } from "./CheckoutPageDataContext"

type CheckoutPaymentSectionProps = {
  cart: Cart | null
}

type PaymentSessionSnapshot = {
  id: string
  status: string | null
  provider_id: string | null
}

export const CheckoutPaymentSection = ({
  cart,
}: CheckoutPaymentSectionProps) => {
  const marketplacePaymentInitError = useCheckoutElementsSecret(
    (state) => state.marketplacePaymentInitError
  )
  const { isLoading: checkoutDataLoading } = useCheckoutPageData()
  const method = useCheckoutPayment((state) => state.method)
  const setMethod = useCheckoutPayment((state) => state.setMethod)
  const setCardComplete = useCheckoutPayment((state) => state.setCardComplete)
  const selectedPaymentMethodId = useCheckoutPayment(
    (state) => state.selectedPaymentMethodId
  )
  const setSelectedPaymentMethodId = useCheckoutPayment(
    (state) => state.setSelectedPaymentMethodId
  )
  const useNewCard = useCheckoutPayment((state) => state.useNewCard)
  const setUseNewCard = useCheckoutPayment((state) => state.setUseNewCard)

  const paymentSessionSnapshots = useMemo<PaymentSessionSnapshot[]>(() => {
    return (
      cart?.payment_collection?.payment_sessions?.map((session) => ({
        id: session.id,
        status: session.status ?? null,
        provider_id: session.provider_id ?? null,
      })) ?? []
    )
  }, [cart?.payment_collection?.payment_sessions])

  const { promptpaySession, nonStripeSession } = useMemo(() => {
    const promptpay = paymentSessionSnapshots.find((session) =>
      session.provider_id?.toLowerCase().includes("promptpay")
    )
    const nonStripe = paymentSessionSnapshots.find(
      (session) =>
        !session.provider_id?.toLowerCase().includes("stripe") &&
        !session.provider_id?.toLowerCase().includes("card")
    )

    return {
      promptpaySession: promptpay,
      nonStripeSession: nonStripe,
    }
  }, [paymentSessionSnapshots])

  const paymentSessionsSignature = useMemo(
    () => JSON.stringify(paymentSessionSnapshots),
    [paymentSessionSnapshots]
  )

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

    if (nonStripeSession) {
      setMethod("qrcode")
    }
  }, [
    cart?.payment_collection?.payment_sessions?.length,
    cart?.id,
    nonStripeSession,
    paymentSessionsSignature,
    promptpaySession,
    setMethod,
  ])

  const showNewCardForm = useNewCard

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

  const handleNewCardSuccess = useCallback(
    async (paymentMethod: CustomerPaymentMethod) => {
      setSelectedPaymentMethodId(paymentMethod.id)
      setUseNewCard(false)
    },
    [setSelectedPaymentMethodId, setUseNewCard]
  )

  const cardPaymentNotice = (() => {
    if (marketplacePaymentInitError) {
      return marketplacePaymentInitError
    }
    if (!cart?.shipping_methods?.length) {
      return "กำลังเตรียมระบบชำระเงิน… กรุณาเลือกวิธีจัดส่งให้ครบก่อน"
    }
    return null
  })()

  return (
    <div className="bg-white p-6 flex flex-col gap-6 relative">
      <div className="flex items-center gap-2 border-b border-sop-neutral-gray-light pb-4">
        <Wallet className="w-[18px] md:w-[25px] h-[18px] md:h-[25px] text-sop-primary-500" />
        <Heading
          level="h2"
          className="sop-body-sm-regular md:sop-headline-sm-medium text-sop-primary-500"
        >
          วิธีการชำระเงิน
        </Heading>
      </div>

      {checkoutDataLoading ? (
        <Text className="text-sm text-gray-500">กำลังโหลดวิธีชำระเงิน…</Text>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => handleMethodChange("qrcode")}
          >
            <div
              className={clx(
                "w-sop-16px md:w-sop-20px h-sop-16px md:h-sop-20px rounded-full border flex items-center justify-center mt-0.5",
                method === "qrcode" ? "border-purple-600" : "border-gray-300"
              )}
            >
              {method === "qrcode" && (
                <div className="w-[6px] md:w-2 h-[6px] md:h-2 rounded-full bg-purple-600" />
              )}
            </div>
            <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-base-black">
              QR Code
            </Text>
          </div>

          <div className="flex flex-col gap-3">
            <div
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => handleMethodChange("card")}
            >
              <div
                className={clx(
                  "w-sop-16px md:w-sop-20px h-sop-16px md:h-sop-20px rounded-full border flex items-center justify-center mt-0.5",
                  method === "card" ? "border-purple-600" : "border-gray-300"
                )}
              >
                {method === "card" && (
                  <div className="w-[6px] md:w-2 h-[6px] md:h-2 rounded-full bg-purple-600" />
                )}
              </div>
              <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-base-black">
                บัตรเครดิต/บัตรเดบิต
              </Text>
            </div>

            {method === "card" && (
              <div className="pl-8 flex flex-col gap-4">
                {cardPaymentNotice && (
                  <Text
                    className={clx(
                      "sop-body-sm-regular",
                      marketplacePaymentInitError
                        ? "text-red-600"
                        : "text-sop-neutral-gray-300"
                    )}
                  >
                    {cardPaymentNotice}
                  </Text>
                )}

                {showNewCardForm ? (
                  <CreditCardCheckoutForm onSuccess={handleNewCardSuccess} />
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

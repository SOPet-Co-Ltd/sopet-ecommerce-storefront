"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { Wallet, Plus, Check } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button, PaymentProviderIcon } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { isStripe } from "@/lib/constants"
import { useCheckoutPayment } from "./CheckoutPaymentContext"
import { useCheckoutElementsSecret } from "./CheckoutElementsSecretContext"
import { CreditCardCheckoutForm } from "@/components/molecules/CreditCardForm/CreditCardCheckoutForm"
import { toast } from "@/lib/helpers/toast"
import { useCheckoutPageData } from "@/app/[locale]/(checkout)/_providers/checkout-page-data-context"

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
  const { clientSecret: elementsClientSecret, marketplacePaymentInitError } =
    useCheckoutElementsSecret()
  const {
    customer,
    savedStripePaymentMethods,
    isLoading: checkoutDataLoading,
    refetchSavedStripePaymentMethods,
  } = useCheckoutPageData()
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

  const isStripeProvider = useCallback(
    (providerId?: string | null) => isStripe(providerId ?? undefined),
    []
  )

  const paymentSessionSnapshots = useMemo<PaymentSessionSnapshot[]>(() => {
    return (
      cart?.payment_collection?.payment_sessions?.map((session) => ({
        id: session.id,
        status: session.status ?? null,
        provider_id: session.provider_id ?? null,
      })) ?? []
    )
  }, [cart?.payment_collection?.payment_sessions])

  const { stripeSession, promptpaySession, nonStripeSession } = useMemo(() => {
    const stripe = paymentSessionSnapshots.find((session) =>
      isStripeProvider(session.provider_id)
    )
    const promptpay = paymentSessionSnapshots.find((session) =>
      session.provider_id?.toLowerCase().includes("promptpay")
    )
    const nonStripe = paymentSessionSnapshots.find(
      (session) => !isStripeProvider(session.provider_id)
    )

    return {
      stripeSession: stripe,
      promptpaySession: promptpay,
      nonStripeSession: nonStripe,
    }
  }, [isStripeProvider, paymentSessionSnapshots])

  const paymentSessionsSignature = useMemo(
    () => JSON.stringify(paymentSessionSnapshots),
    [paymentSessionSnapshots]
  )

  /** Stable identity — `customer` from RSC often gets a new object reference each refresh. */
  const customerId = customer?.id ?? null

  useEffect(() => {
    if (method !== "card" || !customerId || checkoutDataLoading) {
      return
    }
    setSavedPaymentMethods(savedStripePaymentMethods)
    const currentId = selectedPmIdRef.current
    const stillValid =
      savedStripePaymentMethods.length > 0 &&
      savedStripePaymentMethods.some((pm) => pm.id === currentId)

    if (!stillValid && savedStripePaymentMethods.length > 0) {
      const defaultPm =
        savedStripePaymentMethods.find((pm) => pm.is_default) ||
        savedStripePaymentMethods[0]
      if (defaultPm) {
        setSelectedPaymentMethodId(defaultPm.id)
      }
    }
  }, [
    checkoutDataLoading,
    customerId,
    method,
    savedStripePaymentMethods,
    setSavedPaymentMethods,
    setSelectedPaymentMethodId,
  ])

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
  }, [paymentSessionsSignature, cart?.id, setMethod])

  const showNewCardForm = useNewCard || savedPaymentMethods.length === 0

  const meta = customer?.metadata as Record<string, unknown> | undefined
  const rawStripeCustomerId = meta?.stripe_customer_id
  const stripeCustomerIdFromMeta =
    typeof rawStripeCustomerId === "string" ? rawStripeCustomerId : ""

  const missingStripeToastShownRef = useRef(false)
  const toastCustomerIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (!customerId) {
      return
    }
    if (toastCustomerIdRef.current !== customerId) {
      toastCustomerIdRef.current = customerId
      missingStripeToastShownRef.current = false
    }
    if (!stripeCustomerIdFromMeta.trim()) {
      if (!missingStripeToastShownRef.current) {
        missingStripeToastShownRef.current = true
        toast.error({
          title: "ไม่สามารถเพิ่มบัตรได้",
          description: "กรุณารีเฟรชหรือเข้าสู่ระบบใหม่",
        })
      }
    }
  }, [customerId, stripeCustomerIdFromMeta])

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
    refetchSavedStripePaymentMethods().finally(() => {
      setUseNewCard(false)
    })
  }, [refetchSavedStripePaymentMethods, setUseNewCard])

  const cardElementsWaitingMessage = (() => {
    if (marketplacePaymentInitError) {
      return marketplacePaymentInitError
    }
    if (!cart?.shipping_methods?.length) {
      return "กำลังเตรียมระบบชำระเงิน… กรุณาเลือกวิธีจัดส่งให้ครบก่อน"
    }
    return "กำลังเตรียมระบบชำระเงิน…"
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
        <Text className="text-sm text-gray-500">
          กำลังโหลดวิธีชำระเงินและบัตรที่บันทึกไว้…
        </Text>
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
                {!elementsClientSecret ? (
                  <Text
                    className={clx(
                      "sop-body-sm-regular",
                      marketplacePaymentInitError
                        ? "text-red-600"
                        : "text-sop-neutral-gray-300"
                    )}
                  >
                    {cardElementsWaitingMessage}
                  </Text>
                ) : !showNewCardForm ? (
                  <>
                    {savedPaymentMethods.map((pm) => (
                      <div
                        key={pm.id}
                        className={clx(
                          "flex items-center justify-between py-3 cursor-pointer"
                        )}
                        onClick={() => setSelectedPaymentMethodId(pm.id)}
                      >
                        <div className="flex items-center gap-3">
                          <PaymentProviderIcon
                            brand={pm.brand}
                            size={40}
                            className="shrink-0"
                          />
                          <Text className="md:sop-body-lg-regular sop-body-md-regular text-sop-neutral-gray-300">
                            {pm.last4 ? `****${pm.last4}` : "บัตรที่บันทึกไว้"}
                          </Text>
                        </div>
                        {selectedPaymentMethodId === pm.id && (
                          <Check className="w-4 h-4 text-sop-primary-500" />
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
      )}
    </div>
  )
}

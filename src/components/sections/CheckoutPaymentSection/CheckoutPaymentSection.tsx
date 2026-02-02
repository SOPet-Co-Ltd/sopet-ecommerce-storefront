"use client"

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Wallet, Plus, Check } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { initiatePaymentSession, setShippingMethod } from "@/lib/data/cart"
import { useRouter } from "next/navigation"
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
} from "@stripe/react-stripe-js"
import type {
  StripeCardCvcElementOptions,
  StripeCardExpiryElementOptions,
  StripeCardNumberElementOptions,
} from "@stripe/stripe-js"
import { isManual, isStripe } from "@/lib/constants"
import { StripeContext } from "@/components/organisms/PaymentContainer/StripeWrapper"
import { useCheckoutPayment } from "./CheckoutPaymentContext"

type CheckoutPaymentSectionProps = {
  cart: Cart | null
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  shippingMethods: { id: string }[]
}

export const CheckoutPaymentSection = ({
  cart,
  paymentMethods,
  shippingMethods,
}: CheckoutPaymentSectionProps) => {
  const {
    method,
    setMethod,
    cardholderName,
    setCardholderName,
    setCardComplete,
    setCardError,
  } = useCheckoutPayment()
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [cardNumberComplete, setCardNumberComplete] = useState(false)
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false)
  const [cardCvcComplete, setCardCvcComplete] = useState(false)
  const [cardNumberError, setCardNumberError] = useState<string | null>(null)
  const [cardExpiryError, setCardExpiryError] = useState<string | null>(null)
  const [cardCvcError, setCardCvcError] = useState<string | null>(null)
  const autoInitRef = useRef(false)

  const router = useRouter()
  const stripeReady = useContext(StripeContext)

  const isStripeProvider = (providerId?: string) => isStripe(providerId)

  const stripeProviderId = paymentMethods?.find((p) =>
    isStripeProvider(p.id)
  )?.id
  const manualProviderId =
    paymentMethods?.find((p) => isManual(p.id))?.id ||
    paymentMethods?.find((p) => !isStripeProvider(p.id))?.id
  const stripeSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => isStripeProvider(session.provider_id)
  )
  const nonStripeSession = cart?.payment_collection?.payment_sessions?.find(
    (session) => !isStripeProvider(session.provider_id)
  )

  const baseElementStyles = useMemo(
    () => ({
      style: {
        base: {
          fontFamily: "inherit",
          fontSize: "14px",
          color: "#111827",
          "::placeholder": {
            color: "#9CA3AF",
          },
        },
        invalid: {
          color: "#ef4444",
        },
      },
    }),
    []
  )

  const cardNumberOptions = useMemo<StripeCardNumberElementOptions>(
    () => ({
      ...baseElementStyles,
      placeholder: "หมายเลขบัตร",
      disableLink: true,
    }),
    [baseElementStyles]
  )

  const cardExpiryOptions = useMemo<StripeCardExpiryElementOptions>(
    () => ({
      ...baseElementStyles,
      placeholder: "วันหมดอายุ",
    }),
    [baseElementStyles]
  )

  const cardCvcOptions = useMemo<StripeCardCvcElementOptions>(
    () => ({
      ...baseElementStyles,
      placeholder: "CVV",
    }),
    [baseElementStyles]
  )

  useEffect(() => {
    if (!cart?.payment_collection?.payment_sessions?.length) {
      return
    }

    if (stripeSession) {
      setMethod("card")
      return
    }

    if (nonStripeSession) {
      setMethod("qrcode")
    }
  }, [cart, nonStripeSession, setMethod, stripeSession])

  useEffect(() => {
    const isComplete =
      method === "card" &&
      (!isAddingCard || // Assume complete if using saved card/default
        (isAddingCard &&
          cardNumberComplete &&
          cardExpiryComplete &&
          cardCvcComplete))
    setCardComplete(isComplete)
  }, [
    method,
    isAddingCard,
    cardNumberComplete,
    cardExpiryComplete,
    cardCvcComplete,
    setCardComplete,
  ])

  useEffect(() => {
    setCardError(cardNumberError || cardExpiryError || cardCvcError || null)
  }, [cardNumberError, cardExpiryError, cardCvcError, setCardError])

  useEffect(() => {
    if (method !== "card" || !isAddingCard) {
      setCardNumberComplete(false)
      setCardExpiryComplete(false)
      setCardCvcComplete(false)
      setCardNumberError(null)
      setCardExpiryError(null)
      setCardCvcError(null)
    }
  }, [method, isAddingCard])

  const handleMethodChange = useCallback(
    async (newMethod: "qrcode" | "card") => {
      setMethod(newMethod)
      if (newMethod !== "card") {
        setIsAddingCard(false)
      }
      setIsLoading(true)

      const providerId =
        newMethod === "card" ? stripeProviderId : manualProviderId

      if (!providerId) {
        console.error("Payment provider not available for method:", newMethod)
        setIsLoading(false)
        return false
      }

      const getPreferredShippingOptionId = () => {
        if (!cart) return ""

        const storageKey = `checkout:selected_shipping_option:${cart.id}`
        const selectedFromStorage =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey) || ""
            : ""
        const validStorageSelection = selectedFromStorage
          ? shippingMethods.some((sm) => sm.id === selectedFromStorage)
          : false

        return (
          (validStorageSelection ? selectedFromStorage : "") ||
          cart.shipping_methods?.[0]?.shipping_option_id ||
          shippingMethods[0]?.id ||
          ""
        )
      }

      const preferredShippingOptionId = getPreferredShippingOptionId()

      if (!preferredShippingOptionId) {
        setCardError("กรุณาเลือกวิธีจัดส่งก่อน")
        setIsLoading(false)
        return false
      }

      const alreadySelected = (cart?.shipping_methods || []).some(
        (method) => method.shipping_option_id === preferredShippingOptionId
      )

      if (!alreadySelected && cart) {
        try {
          await setShippingMethod({
            cartId: cart.id,
            shippingMethodId: preferredShippingOptionId,
          })
        } catch (error) {
          console.error(
            "[CheckoutPaymentSection] Failed to set shipping before payment session:",
            error
          )
          setIsLoading(false)
          return false
        }
      }

      if (cart && providerId) {
        try {
          await initiatePaymentSession(cart, {
            provider_id: providerId,
          })

          router.refresh()
          return true
        } catch (e) {
          console.error("[CheckoutPaymentSection] Failed to init session:", e)
          return false
        } finally {
          setIsLoading(false)
        }
      }
      setIsLoading(false)
      return false
    },
    [
      cart,
      manualProviderId,
      router,
      setCardError,
      setMethod,
      shippingMethods,
      stripeProviderId,
    ]
  )

  useEffect(() => {
    if (
      method !== "card" ||
      !cart ||
      isLoading ||
      stripeSession ||
      !stripeProviderId
    ) {
      return
    }

    if (autoInitRef.current) {
      return
    }

    autoInitRef.current = true
    void handleMethodChange("card").then((ok) => {
      if (!ok) {
        autoInitRef.current = false
      }
    })
  }, [method, cart, isLoading, stripeSession, handleMethodChange])

  useEffect(() => {
    autoInitRef.current = false
  }, [cart?.id])

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col gap-6 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-lg">
          <Text className="text-purple-600 font-bold">Processing...</Text>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-sop-neutral-gray-light pb-4">
        <Wallet className="w-6 h-6 text-purple-600" />
        <Heading level="h2" className="text-xl text-purple-600 font-bold">
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
              {/* Toggle Logic: For demo, showing saved card if !isAddingCard. User can toggle. */}
              {!isAddingCard ? (
                <>
                  <div
                    className="flex items-center justify-between p-3 border border-sop-neutral-gray-light rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setIsAddingCard(false)} // Select existing
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-orange-100 rounded flex items-center justify-center relative overflow-hidden">
                        <div className="w-4 h-4 rounded-full bg-red-500 opacity-80 -mr-2 z-10"></div>
                        <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80"></div>
                      </div>
                      <Text className="text-gray-700">****9999</Text>
                    </div>
                    <Check className="w-4 h-4 text-purple-600" />
                  </div>

                  <Button
                    variant="secondary"
                    className="w-fit flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 px-4 py-2 h-auto rounded-full"
                    onClick={() => setIsAddingCard(true)}
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <p>เพิ่มบัตรใหม่</p>
                    </div>
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-colors focus-within:border-purple-600">
                    {stripeReady ? (
                      <CardNumberElement
                        className="w-full"
                        options={cardNumberOptions}
                        onChange={(event) => {
                          setCardNumberComplete(event.complete)
                          setCardNumberError(event.error?.message || null)
                        }}
                      />
                    ) : (
                      <span className="text-gray-400">หมายเลขบัตร</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-colors focus-within:border-purple-600">
                      {stripeReady ? (
                        <CardExpiryElement
                          className="w-full"
                          options={cardExpiryOptions}
                          onChange={(event) => {
                            setCardExpiryComplete(event.complete)
                            setCardExpiryError(event.error?.message || null)
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">วันหมดอายุ</span>
                      )}
                    </div>
                    <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm transition-colors focus-within:border-purple-600">
                      {stripeReady ? (
                        <CardCvcElement
                          className="w-full"
                          options={cardCvcOptions}
                          onChange={(event) => {
                            setCardCvcComplete(event.complete)
                            setCardCvcError(event.error?.message || null)
                          }}
                        />
                      ) : (
                        <span className="text-gray-400">CVV</span>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="ชื่อผู้ถือบัตร"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-600 transition-colors placeholder:text-gray-400"
                    value={cardholderName}
                    onChange={(event) => setCardholderName(event.target.value)}
                  />

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="secondary"
                      className="text-gray-500 hover:text-gray-700 border-none bg-transparent shadow-none"
                      onClick={() => setIsAddingCard(false)}
                    >
                      ยกเลิก
                    </Button>
                    {/* Add Card Action would go here */}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

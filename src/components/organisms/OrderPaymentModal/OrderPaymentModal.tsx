"use client"

import { Button } from "@/components/atoms/Button/Button"
import { X, Clock, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe } from "@stripe/react-stripe-js"
import { OrderPaymentForm } from "./OrderPaymentForm"
import {
  getOrderCustomerPaymentMethods,
  retrievePaymentCollection,
} from "@/lib/data/orders"
import type { OrderDetails, OrderPaymentSession } from "@/types/order"

interface OrderPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  order: OrderDetails
  onPaymentSuccess?: () => void | Promise<void>
  forceMethodSelection?: boolean
  selectedCardId?: string | null
}

type PromptPayDisplayQrAction = {
  type: "promptpay_display_qr_code"
  promptpay_display_qr_code?: {
    hosted_instructions_url?: string
    image_url_svg?: string
    image_url_png?: string
  }
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unknown error"
}

// Inner component to handle Stripe PromptPay auto-confirmation and QR retrieval
const PromptPayDisplay = ({
  clientSecret,
  orderTotal,
  orderEmail,
  orderName,
  countdown,
  onClose,
  onPaymentSuccess,
}: {
  clientSecret: string
  orderTotal: number
  orderEmail: string
  orderName: string
  countdown: number
  onClose: () => void
  onPaymentSuccess?: () => void | Promise<void>
}) => {
  const stripe = useStripe()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [hostedInstructionsUrl, setHostedInstructionsUrl] = useState<
    string | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(true)

  const latestCallbacks = useRef({ onPaymentSuccess, onClose })
  useEffect(() => {
    latestCallbacks.current = { onPaymentSuccess, onClose }
  }, [onPaymentSuccess, onClose])

  // Polling for payment success while displaying QR
  useEffect(() => {
    if (!qrCodeUrl || !stripe || !clientSecret) return

    const intervalId = setInterval(async () => {
      try {
        const { paymentIntent } =
          await stripe.retrievePaymentIntent(clientSecret)
        if (
          paymentIntent &&
          (paymentIntent.status === "succeeded" ||
            paymentIntent.status === "processing")
        ) {
          clearInterval(intervalId)
          const { onPaymentSuccess: successCb, onClose: closeCb } =
            latestCallbacks.current
          if (successCb) {
            await successCb()
          }
          closeCb()
        }
      } catch (error: unknown) {
        console.error("Error polling payment intent", error)
      }
    }, 3000)

    return () => clearInterval(intervalId)
  }, [qrCodeUrl, stripe, clientSecret])

  useEffect(() => {
    if (!stripe) return

    let isMounted = true

    const generateQR = async () => {
      try {
        setIsConfirming(true)
        // Auto confirm to get the QR code payload without redirecting natively
        const { error: confirmError, paymentIntent } =
          await stripe.confirmPromptPayPayment(
            clientSecret,
            {
              payment_method: {
                billing_details: {
                  name: orderName,
                  email: orderEmail,
                },
              },
            },
            { handleActions: false } // We want to handle the action (display QR) ourselves
          )

        if (!isMounted) return

        if (confirmError) {
          setError(confirmError.message || "Failed to generate QR code")
        } else if (
          paymentIntent?.status === "requires_action" &&
          paymentIntent.next_action?.type === "promptpay_display_qr_code"
        ) {
          const nextAction =
            paymentIntent.next_action as PromptPayDisplayQrAction
          const qrData = nextAction.promptpay_display_qr_code

          if (qrData?.hosted_instructions_url) {
            setHostedInstructionsUrl(qrData.hosted_instructions_url)
          }

          if (qrData?.image_url_svg || qrData?.image_url_png) {
            setQrCodeUrl(qrData.image_url_svg ?? qrData.image_url_png ?? null)
          } else {
            setError("QR code image URL not found in response")
          }
        } else if (
          paymentIntent?.status === "succeeded" ||
          paymentIntent?.status === "processing"
        ) {
          // Already paid or processing
          setError("Payment is already completed or processing. Please wait.")
        } else {
          setError("Unexpected payment status: " + paymentIntent?.status)
        }
      } catch (error: unknown) {
        if (isMounted)
          setError(
            toErrorMessage(error) || "An error occurred retrieving the QR Code"
          )
      } finally {
        if (isMounted) setIsConfirming(false)
      }
    }

    generateQR()

    return () => {
      isMounted = false
    }
  }, [stripe, clientSecret, orderEmail, orderName])

  const mins = Math.floor(countdown / 60)
  const secs = countdown % 60
  const minutesStr = mins.toString().padStart(2, "0")
  const secondsStr = secs.toString().padStart(2, "0")

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 flex flex-col gap-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Timer Banner */}
        <div className="bg-sop-primary-200 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sop-primary-500" />
            <p className="text-sm text-gray-800">ชำระเงินผ่าน QR code ภายใน</p>
          </div>
          <div className="flex items-center gap-1 text-red-500 font-medium">
            <span>{minutesStr}</span>
            <span>:</span>
            <span>{secondsStr}</span>
            <span>:</span>
            <span>00</span>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between py-3">
          <p className="text-gray-800 font-medium">ยอดชำระรวม</p>
          <p className="text-gray-800 font-medium">฿{orderTotal.toFixed(2)}</p>
        </div>

        {/* QR Code */}
        <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col items-center min-h-[250px] justify-center relative">
          {isConfirming ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-sop-primary-500" />
              <p className="text-gray-500 text-sm">กำลังสร้างคิวอาร์โค้ด...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500 bg-red-50 w-full h-full flex items-center justify-center">
              <p>{error}</p>
            </div>
          ) : qrCodeUrl ? (
            <div className="bg-white p-4 flex flex-col items-center justify-center w-full">
              <img
                src={qrCodeUrl}
                alt="PromptPay QR Code"
                className="max-w-[200px] md:max-w-[250px] w-full"
              />
              <p className="text-xs text-gray-400 mt-4 text-center">
                แสกนเพื่อชำระเงินผ่านแอปธนาคารใดก็ได้
              </p>

              {/* Show Hosted Instructions URL for Testing in Development/Test Mode */}
              {process.env["NEXT_PUBLIC_STRIPE_KEY"]?.includes("test") &&
                hostedInstructionsUrl && (
                  <a
                    href={hostedInstructionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full"
                  >
                    <Button
                      variant="outline"
                      className="w-full text-xs bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                    >
                      จำลองการจ่ายเงิน (Test Mode) -&gt;
                    </Button>
                  </a>
                )}
            </div>
          ) : null}
        </div>

        {/* Save Button */}
        <Button
          variant="outline"
          className="w-full rounded-lg border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-secondary-50"
          onClick={() => {
            alert("QR Code save feature coming soon")
          }}
          disabled={!qrCodeUrl}
        >
          บันทึก QR Code
        </Button>
      </div>
    </div>
  )
}

const stripeKey = process.env["NEXT_PUBLIC_STRIPE_KEY"]
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

export const OrderPaymentModal = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
  forceMethodSelection = false,
  selectedCardId,
}: OrderPaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(180) // 3 minutes in seconds
  const [isLoading, setIsLoading] = useState(false)
  const [autoSelectedCardId, setAutoSelectedCardId] = useState<string | null>(
    null
  )

  // Fetch saved cards to auto-select one if selectedCardId is missing
  useEffect(() => {
    if (isOpen && !selectedCardId) {
      const storedCardId =
        typeof window !== "undefined"
          ? sessionStorage.getItem(`order_${order?.id}_cardId`)
          : null

      if (storedCardId) {
        setAutoSelectedCardId(storedCardId)
      } else {
        getOrderCustomerPaymentMethods().then((res) => {
          if (res.success && res.paymentMethods.length > 0) {
            const defaultCard = res.paymentMethods.find((pm) => pm.is_default)
            setAutoSelectedCardId(
              defaultCard?.id ?? res.paymentMethods[0]?.id ?? null
            )
          }
        })
      }
    }
  }, [isOpen, selectedCardId, order?.id])

  // Check if order already has an active payment session
  useEffect(() => {
    if (!isOpen || !order) return

    let isMounted = true

    const fetchSession = async () => {
      setIsLoading(true)
      const paymentCollectionId = order?.payment_collections?.[0]?.id

      if (!paymentCollectionId) {
        if (isMounted) {
          setError("กรุณาเลือกช่องทางการชำระเงินก่อนทำรายการ")
          setIsLoading(false)
        }
        return
      }

      const paymentCollection =
        await retrievePaymentCollection(paymentCollectionId)

      if (!isMounted) return

      // Sort sessions by created_at descending to get the latest one
      const sortedSessions = [
        ...(paymentCollection?.payment_sessions ?? []),
      ].sort((a: OrderPaymentSession, b: OrderPaymentSession) => {
        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        )
      })
      const existingSession = sortedSessions.find(
        (session: OrderPaymentSession) => session.status === "pending"
      )
      if (existingSession && !forceMethodSelection) {
        // Use existing payment session
        const secret = existingSession.data?.client_secret
        const method = existingSession.provider_id

        if (secret && method) {
          setClientSecret(secret)
          // Map Medusa provider ID to component's internal selectedMethod state
          if (method.includes("promptpay")) {
            setSelectedMethod("promptpay")
          } else if (method.includes("stripe") || method.includes("card")) {
            setSelectedMethod("stripe")
          } else {
            setSelectedMethod(method)
          }
          setError(null)
        } else {
          setError(
            "ไม่พบข้อมูล Payment Session ที่ถูกต้อง กรุณาเลือกช่องทางชำระเงินใหม่"
          )
        }
      } else {
        // No existing session or forced to select method
        setError("กรุณาเลือกช่องทางการชำระเงินก่อนทำรายการ")
      }
      setIsLoading(false)
    }

    fetchSession()

    return () => {
      isMounted = false
    }
  }, [isOpen, order, forceMethodSelection])

  // Countdown timer for QR code
  useEffect(() => {
    if (selectedMethod === "promptpay" && clientSecret) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [selectedMethod, clientSecret])

  const handleClose = () => {
    setSelectedMethod(null)
    setClientSecret(null)
    setError(null)
    setCountdown(180)
    onClose()
  }

  if (!isOpen) return null

  // Show Stripe payment form if client secret is available
  if (clientSecret && selectedMethod === "stripe") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <OrderPaymentForm
            order={order}
            onClose={handleClose}
            selectedCardId={selectedCardId || autoSelectedCardId}
            clientSecret={clientSecret}
            {...(onPaymentSuccess ? { onPaymentSuccess } : {})}
          />
        </Elements>
      </div>
    )
  }

  // Show PromptPay QR if selected
  if (clientSecret && selectedMethod === "promptpay") {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PromptPayDisplay
          clientSecret={clientSecret}
          orderTotal={order.total}
          orderEmail={order.email || "customer@example.com"}
          orderName={
            order.shipping_address?.first_name
              ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ""}`.trim()
              : "Customer"
          }
          countdown={countdown}
          onClose={handleClose}
          {...(onPaymentSuccess ? { onPaymentSuccess } : {})}
        />
      </Elements>
    )
  }

  // If no method selected or valid session, show error or loading
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 flex flex-col gap-5 items-center justify-center min-h-[200px]">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {error ? (
          <div className="text-center space-y-3">
            <p className="text-red-500 font-medium">{error}</p>
            <Button
              variant="outline"
              className="rounded-full border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50"
              onClick={handleClose}
            >
              ปิดหน้าต่าง
            </Button>
          </div>
        ) : (
          <p className="text-gray-500">กำลังโหลดข้อมูลการชำระเงิน...</p>
        )}
      </div>
    </div>
  )
}

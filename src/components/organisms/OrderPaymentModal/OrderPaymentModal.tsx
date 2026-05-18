"use client"

import { Button } from "@/components/atoms/Button/Button"
import { X } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { OrderPaymentForm } from "./OrderPaymentForm"
import {
  getOrderCustomerPaymentMethods,
  retrievePaymentCollection,
  updateOrderPaymentSession,
} from "@/lib/data/orders"
import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import {
  formatCountdownHms,
  getPromptPayExpiresAtMsFromStripeIntentCreated,
} from "@/lib/helpers/pending-payment-expiry"
import { writeOrderPromptPayContinuity } from "@/lib/helpers/order-promptpay-continuity"
import {
  getOrderPaymentSessionsSyncKey,
  isOrderPaymentSessionSelectableForCheckout,
  pickPendingPaymentSessionForCheckout,
  resolveOrderCheckoutProviderId,
} from "@/lib/helpers/order-checkout-payment"
import { toast } from "@/lib/helpers/toast"
import type { OrderDetails, OrderPaymentSession } from "@/types/order"

interface OrderPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  order: OrderDetails
  onPaymentSuccess?: () => void | Promise<void>
  onCloseFromQrView?: () => void
  forceMethodSelection?: boolean
  selectedCardId?: string | null
  initialClientSecretsFromChange?: string[] | null
  onConsumedInitialSecrets?: () => void
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Unknown error"
}

const PromptPayDisplay = ({
  orderId,
  clientSecret,
  orderTotal,
  isRegenerating,
  onRegenerateQr,
  onClose,
  onCloseFromQrView,
  onPaymentSuccess,
}: {
  orderId: string
  clientSecret: string
  orderTotal: number
  orderEmail: string
  orderName: string
  isRegenerating: boolean
  onRegenerateQr: () => Promise<void>
  onClose: () => void
  onCloseFromQrView?: () => void
  onPaymentSuccess?: () => void | Promise<void>
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrExpiresAtMs, setQrExpiresAtMs] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const latestCallbacks = useRef({ onPaymentSuccess, onClose })
  useEffect(() => {
    latestCallbacks.current = { onPaymentSuccess, onClose }
  }, [onPaymentSuccess, onClose])

  useEffect(() => {
    setQrExpiresAtMs(null)
  }, [clientSecret])

  const { remainingSeconds, isExpired: isTimerExpired } = usePaymentCountdown(
    qrCodeUrl && qrExpiresAtMs != null ? qrExpiresAtMs : null
  )
  const hms =
    remainingSeconds != null ? formatCountdownHms(remainingSeconds) : null
  const showExpiredOverlay =
    isTimerExpired && !!qrCodeUrl && !isConfirming && !error

  const handleClose = () => {
    if (onCloseFromQrView) onCloseFromQrView()
    else onClose()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-[500px] bg-white rounded-3xl p-6 flex flex-col gap-5">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          aria-label="ปิด"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="bg-sop-primary-200 rounded-lg px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-800">ชำระเงินผ่าน QR code ภายใน</p>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-red-500 font-medium tabular-nums">
              {!qrCodeUrl || qrExpiresAtMs == null ? (
                <span className="text-gray-500 font-normal">—</span>
              ) : isTimerExpired ? (
                <span>หมดเวลา</span>
              ) : hms ? (
                <>
                  <span>{hms.h}</span>
                  <span>:</span>
                  <span>{hms.m}</span>
                  <span>:</span>
                  <span>{hms.s}</span>
                </>
              ) : (
                <span className="text-gray-500 font-normal">—</span>
              )}
            </div>
            {isTimerExpired && !isRegenerating && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs border-sop-primary-500 text-sop-primary-600"
                onClick={() => onRegenerateQr()}
              >
                สร้าง QR ใหม่
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-3">
          <p className="text-gray-800 font-medium">ยอดชำระรวม</p>
          <p className="text-gray-800 font-medium">฿{orderTotal.toFixed(2)}</p>
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col items-center min-h-[250px] justify-center relative">
          {isRegenerating ? (
            <p className="text-gray-500 text-sm">
              กำลังสร้างคิวอาร์โค้ดใหม่...
            </p>
          ) : isConfirming ? (
            <p className="text-gray-500 text-sm">กำลังสร้างคิวอาร์โค้ด...</p>
          ) : error ? (
            <div className="p-6 text-center text-red-500 bg-red-50 w-full h-full flex flex-col items-center justify-center gap-4">
              <p>{error}</p>
              <Button
                variant="outline"
                className="rounded-lg border-sop-primary-500 text-sop-primary-500"
                type="button"
                onClick={() => onRegenerateQr()}
              >
                สร้าง QR ใหม่
              </Button>
            </div>
          ) : qrCodeUrl ? (
            <div className="bg-white p-4 flex flex-col items-center justify-center w-full relative">
              <img
                src={qrCodeUrl}
                alt="PromptPay QR Code"
                className="max-w-[200px] md:max-w-[250px] w-full"
              />
              <p className="text-xs text-gray-400 mt-4 text-center">
                แสกนเพื่อชำระเงินผ่านแอปธนาคารใดก็ได้
              </p>
              {showExpiredOverlay && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-4 p-4">
                  <p className="text-red-600 font-medium text-center">
                    QR หมดเวลาแล้ว
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-lg border-sop-primary-500 text-sop-primary-500"
                    type="button"
                    onClick={() => onRegenerateQr()}
                  >
                    สร้าง QR ใหม่
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">ระบบ QR อยู่ระหว่างอัปเดต</p>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full rounded-lg border-sop-secondary-500 text-sop-secondary-500 hover:bg-sop-secondary-50"
          onClick={() => {
            alert("QR Code save feature coming soon")
          }}
          disabled={!qrCodeUrl || showExpiredOverlay}
        >
          บันทึก QR Code
        </Button>
      </div>
    </div>
  )
}

function sortSessionsNewestFirst(
  sessions: OrderPaymentSession[]
): OrderPaymentSession[] {
  return [...sessions].sort((a, b) => {
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    )
  })
}

export const OrderPaymentModal = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
  onCloseFromQrView,
  forceMethodSelection = false,
  selectedCardId,
  initialClientSecretsFromChange = null,
  onConsumedInitialSecrets,
}: OrderPaymentModalProps) => {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [paymentClientSecrets, setPaymentClientSecrets] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false)
  const [autoSelectedCardId, setAutoSelectedCardId] = useState<string | null>(
    null
  )

  const orderRef = useRef(order)
  orderRef.current = order

  const initialSecretsFromChangeRef = useRef(initialClientSecretsFromChange)
  initialSecretsFromChangeRef.current = initialClientSecretsFromChange

  const onConsumedInitialSecretsRef = useRef(onConsumedInitialSecrets)
  onConsumedInitialSecretsRef.current = onConsumedInitialSecrets

  const paymentSessionsSyncKey = getOrderPaymentSessionsSyncKey(order)

  const cardBootstrapForOpenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      cardBootstrapForOpenRef.current = null
      return
    }

    if (selectedCardId) {
      return
    }

    const openKey = `${order.id}:${paymentSessionsSyncKey}`
    if (cardBootstrapForOpenRef.current === openKey) {
      return
    }
    cardBootstrapForOpenRef.current = openKey

    const storedCardId =
      typeof window !== "undefined"
        ? sessionStorage.getItem(`order_${order.id}_cardId`)
        : null

    if (storedCardId) {
      setAutoSelectedCardId(storedCardId)
      return
    }

    getOrderCustomerPaymentMethods().then((res) => {
      if (res.success && res.paymentMethods.length > 0) {
        const defaultCard = res.paymentMethods.find((pm) => pm.is_default)
        setAutoSelectedCardId(
          defaultCard?.id ?? res.paymentMethods[0]?.id ?? null
        )
      }
    })
  }, [isOpen, selectedCardId, order.id, paymentSessionsSyncKey])

  useEffect(() => {
    if (!isOpen) return
    if (!orderRef.current) return

    let isMounted = true

    const fetchSession = async () => {
      const currentOrder = orderRef.current
      const collections = currentOrder?.payment_collections ?? []

      const preferredProvider = resolveOrderCheckoutProviderId(currentOrder)
      const prefLower = preferredProvider?.toLowerCase() ?? ""
      const wantsPromptPay = prefLower.includes("promptpay")

      const bootstrap = initialSecretsFromChangeRef.current
      if (bootstrap?.length) {
        if (collections.length > 1 && wantsPromptPay) {
          if (isMounted) {
            setPaymentClientSecrets([])
            setSelectedMethod(null)
            setError(
              "คำสั่งซื้อจากหลายร้าน โปรดชำระด้วยบัตรเครดิต/เดบิต (PromptPay ใช้ได้เพียงร้านเดียว)"
            )
          }
          onConsumedInitialSecretsRef.current?.()
          return
        }

        if (collections.length > 1 && bootstrap.length !== collections.length) {
          if (isMounted) {
            setPaymentClientSecrets([])
            setSelectedMethod(null)
            setError(
              "ไม่พบ Payment Session ครบทุกร้าน กรุณาเปลี่ยนช่องทางชำระเงินแล้วลองอีกครั้ง"
            )
          }
          onConsumedInitialSecretsRef.current?.()
          return
        }

        if (isMounted) {
          setPaymentClientSecrets(bootstrap)
          setError(null)
          if (prefLower.includes("promptpay")) {
            setSelectedMethod("promptpay")
          } else {
            setSelectedMethod("omise")
          }
        }
        onConsumedInitialSecretsRef.current?.()
        return
      }

      if (!collections.length) {
        if (isMounted) {
          setPaymentClientSecrets([])
          setSelectedMethod(null)
          setError("กรุณาเลือกช่องทางการชำระเงินก่อนทำรายการ")
        }
        return
      }

      setPaymentClientSecrets([])
      setSelectedMethod(null)
      setError(null)

      if (collections.length > 1 && wantsPromptPay) {
        if (isMounted) {
          setError(
            "คำสั่งซื้อจากหลายร้าน โปรดชำระด้วยบัตรเครดิต/เดบิต (PromptPay ใช้ได้เพียงร้านเดียว)"
          )
        }
        return
      }

      if (collections.length === 1) {
        const paymentCollectionId = collections[0]!.id
        const paymentCollection =
          await retrievePaymentCollection(paymentCollectionId)

        if (!isMounted) return

        const existingSession = pickPendingPaymentSessionForCheckout(
          paymentCollection?.payment_sessions ?? undefined,
          preferredProvider
        )

        if (existingSession && !forceMethodSelection) {
          const secret = existingSession.data?.client_secret
          const method = existingSession.provider_id

          if (secret && method) {
            setPaymentClientSecrets([secret])
            if (method.includes("promptpay")) {
              setSelectedMethod("promptpay")
            } else {
              setSelectedMethod("omise")
            }
            setError(null)
          } else {
            setError(
              "ไม่พบข้อมูล Payment Session ที่ถูกต้อง กรุณาเลือกช่องทางชำระเงินใหม่"
            )
          }
        } else {
          setError("กรุณาเลือกช่องทางการชำระเงินก่อนทำรายการ")
        }
        return
      }

      const secrets: string[] = []
      const collectionsWithIds = collections.filter((c) => c?.id)
      for (const col of collectionsWithIds) {
        const pc = await retrievePaymentCollection(col.id)
        if (!isMounted) return
        const existingSession = pickPendingPaymentSessionForCheckout(
          pc?.payment_sessions ?? undefined,
          preferredProvider
        )
        const secret = existingSession?.data?.client_secret
        if (typeof secret === "string" && secret.length > 0) {
          secrets.push(secret)
        }
      }

      if (!isMounted) return

      if (secrets.length !== collectionsWithIds.length) {
        setError(
          "ไม่พบ Payment Session ครบทุกร้าน กรุณาเปลี่ยนช่องทางชำระเงินแล้วลองอีกครั้ง"
        )
        return
      }

      setPaymentClientSecrets(secrets)
      setSelectedMethod("omise")
      setError(null)
    }

    fetchSession()

    return () => {
      isMounted = false
    }
  }, [isOpen, paymentSessionsSyncKey, forceMethodSelection])

  const regeneratePromptPayQr = async () => {
    const paymentCollectionId = order.payment_collections?.[0]?.id
    if (!paymentCollectionId) {
      toast.error({ title: "ไม่พบช่องทางชำระเงิน" })
      return
    }

    if ((order.payment_collections?.length ?? 0) > 1) {
      toast.error({
        title: "ไม่สามารถสร้าง QR ใหม่ได้",
        description: "คำสั่งซื้อหลายร้าน โปรดใช้บัตรเครดิต/เดบิต",
      })
      return
    }

    setIsRegeneratingQr(true)
    try {
      const amount = Math.round(Number(order.total) || 0)
      const { success, error: errMsg } = await updateOrderPaymentSession(
        order.id,
        "pp_promptpay_stripe-connect",
        amount > 0 ? amount : undefined
      )
      if (!success) {
        toast.error({
          title: "สร้าง QR ใหม่ไม่สำเร็จ",
          description: errMsg ?? undefined,
        })
        return
      }

      const col = await retrievePaymentCollection(paymentCollectionId)
      const sorted = sortSessionsNewestFirst(col?.payment_sessions ?? [])
      const sess = sorted.find(
        (s) =>
          isOrderPaymentSessionSelectableForCheckout(s.status) &&
          typeof s.provider_id === "string" &&
          s.provider_id.toLowerCase().includes("promptpay")
      )
      const secret = sess?.data?.client_secret
      if (!secret) {
        toast.error({ title: "ไม่พบ session หลังสร้างใหม่" })
        return
      }
      setPaymentClientSecrets([secret])
      router.refresh()
    } finally {
      setIsRegeneratingQr(false)
    }
  }

  const handleClose = () => {
    setSelectedMethod(null)
    setPaymentClientSecrets([])
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  const primaryClientSecret = paymentClientSecrets[0]

  if (primaryClientSecret && selectedMethod === "omise") {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />
        <OrderPaymentForm
          order={order}
          onClose={handleClose}
          selectedCardId={selectedCardId || autoSelectedCardId}
          clientSecrets={paymentClientSecrets}
          {...(onPaymentSuccess ? { onPaymentSuccess } : {})}
        />
      </div>
    )
  }

  if (primaryClientSecret && selectedMethod === "promptpay") {
    return (
      <PromptPayDisplay
        key={primaryClientSecret}
        orderId={order.id}
        clientSecret={primaryClientSecret}
        orderTotal={order.total}
        orderEmail={order.email || "customer@example.com"}
        orderName={
          order.shipping_address?.first_name
            ? `${order.shipping_address.first_name} ${order.shipping_address.last_name || ""}`.trim()
            : "Customer"
        }
        isRegenerating={isRegeneratingQr}
        onRegenerateQr={regeneratePromptPayQr}
        onClose={handleClose}
        onCloseFromQrView={onCloseFromQrView}
        {...(onPaymentSuccess ? { onPaymentSuccess } : {})}
      />
    )
  }

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

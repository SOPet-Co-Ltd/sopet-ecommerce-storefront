"use client"

import { Button } from "@/components/atoms"
import { cn } from "@/lib/utils"
import {
  clearCheckoutCartCookie,
  completeMarketplaceOrder,
} from "@/lib/data/cart"
import { captureOrderPayment } from "@/lib/data/orders"
import { convertToLocale } from "@/lib/helpers/money"
import { getOrderIdFromPlaceOrderResponse } from "@/lib/helpers/place-order-response"
import {
  clearPromptPayCheckoutLock,
  readPromptPayCheckoutLock,
  type PromptPayCheckoutLockV1,
} from "@/lib/helpers/promptpay-checkout-lock"
import { toast } from "@/lib/helpers/toast"
import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import {
  formatCountdownHms,
  getPromptPayCheckoutClickDeadlineMs,
  getPromptPayExpiresAtMsFromStripeIntentCreated,
} from "@/lib/helpers/pending-payment-expiry"
import { getStripePromise } from "@/lib/stripe/get-stripe"
import { Text } from "@medusajs/ui"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export default function PromptPayPendingPageClient() {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || "th"

  const [lock, setLock] = useState<PromptPayCheckoutLockV1 | null>(null)
  const [displayExpiresAtMs, setDisplayExpiresAtMs] = useState<number | null>(
    null
  )
  const [hydrated, setHydrated] = useState(false)
  const [stripe, setStripe] = useState<Awaited<
    ReturnType<typeof getStripePromise>
  > | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const orderPlacedRef = useRef(false)

  useEffect(() => {
    const L = readPromptPayCheckoutLock()
    if (!L) {
      router.replace(`/${locale}/checkout`)
      return
    }
    setLock(L)
    const now = Date.now()
    setDisplayExpiresAtMs(
      L.qrExpiresAtMs <= now
        ? getPromptPayCheckoutClickDeadlineMs()
        : L.qrExpiresAtMs
    )
    setHydrated(true)
    const stripeP = getStripePromise()
    if (stripeP) void stripeP.then(setStripe)
  }, [locale, router])

  useEffect(() => {
    if (!hydrated || !lock || !stripe) {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const { paymentIntent } = await stripe.retrievePaymentIntent(
          lock.clientSecret
        )
        if (cancelled) {
          return
        }

        const now = Date.now()
        const st = paymentIntent?.status

        if (
          st === "canceled" ||
          st === "succeeded" ||
          st === "requires_capture"
        ) {
          return
        }

        const fromPi = getPromptPayExpiresAtMsFromStripeIntentCreated(
          paymentIntent?.created
        )
        let deadline = Math.max(lock.qrExpiresAtMs, fromPi)

        if (deadline <= now) {
          deadline = getPromptPayCheckoutClickDeadlineMs()
        }

        setDisplayExpiresAtMs(deadline)
      } catch {
        if (!cancelled && lock.qrExpiresAtMs <= Date.now()) {
          setDisplayExpiresAtMs(getPromptPayCheckoutClickDeadlineMs())
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrated, lock, stripe])

  const { remainingSeconds, isExpired: isTimerExpired } =
    usePaymentCountdown(displayExpiresAtMs)
  const hms =
    remainingSeconds != null ? formatCountdownHms(remainingSeconds) : null

  const finalizePaid = useCallback(
    async (L: PromptPayCheckoutLockV1) => {
      let orderId = L.orderId
      if (!orderId) {
        const res = await completeMarketplaceOrder(L.cartId, {
          redirect: false,
        })
        orderId = getOrderIdFromPlaceOrderResponse(res)
        if (!orderId) {
          if (!res?.ok) {
            throw new Error(
              (res as { error?: { message?: string } })?.error?.message ||
                "ไม่สามารถยืนยันคำสั่งซื้อได้"
            )
          }
          throw new Error("ไม่พบคำสั่งซื้อ")
        }
      }

      const backoffMs = [0, 900, 2000, 3500]
      let lastErr: string | null = null
      for (let i = 0; i < backoffMs.length; i++) {
        if (backoffMs[i] > 0) {
          await new Promise((r) => setTimeout(r, backoffMs[i]))
        }
        const captureResult = await captureOrderPayment(orderId)
        if (captureResult.success) {
          clearPromptPayCheckoutLock()
          await clearCheckoutCartCookie()
          router.push(`/${locale}/order/${orderId}/confirmed`)
          return
        }
        lastErr = captureResult.error ?? null
      }

      toast.error({
        title: "ยืนยันการชำระเงินไม่สำเร็จ",
        description: lastErr ?? undefined,
      })
      throw new Error(lastErr || "Capture failed")
    },
    [locale, router]
  )

  useEffect(() => {
    if (!hydrated || !lock || !stripe || !isPolling) return

    const timer = window.setInterval(async () => {
      if (orderPlacedRef.current) {
        window.clearInterval(timer)
        return
      }

      try {
        const piResult = await stripe.retrievePaymentIntent(lock.clientSecret)
        const status = piResult.paymentIntent?.status

        if (status === "canceled") {
          window.clearInterval(timer)
          setIsPolling(false)
          toast.error({
            title: "การชำระเงินถูกยกเลิกหรือหมดเวลา",
          })
          return
        }

        if (status === "succeeded" || status === "requires_capture") {
          orderPlacedRef.current = true
          window.clearInterval(timer)
          setIsPolling(false)
          try {
            await finalizePaid(lock)
          } catch (e: unknown) {
            toast.error({
              title: (e as Error)?.message ?? "ไม่สามารถยืนยันคำสั่งซื้อได้",
            })
          }
        }
      } catch {
        // keep polling
      }
    }, 2500)

    return () => {
      window.clearInterval(timer)
    }
  }, [hydrated, lock, stripe, isPolling, finalizePaid])

  const leaveToOrders = () => {
    clearPromptPayCheckoutLock()
    router.push(`/${locale}/user/orders`)
  }

  if (!hydrated || !lock) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <Text className="text-gray-500">กำลังโหลด…</Text>
      </div>
    )
  }

  const totalLabel =
    lock.mode === "redirect"
      ? "เปิดหน้าชำระเงินเพื่อทำรายการให้เสร็จ"
      : lock.mode === "qr" && lock.qrImageUrl
        ? "สแกน QR เพื่อชำระเงิน"
        : "กำลังรอธนาคารยืนยันการชำระเงิน"

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <Text className="sop-body-lg-medium text-gray-900">{totalLabel}</Text>
        <Text className="mt-1 text-sm text-gray-500">
          คำสั่งซื้อของคุณอยู่ในสถานะรอชำระเงิน กรุณาอยู่ในหน้านี้จนกว่าจะสำเร็จ
        </Text>
      </div>

      <div className="rounded-lg bg-sop-primary-50 py-3 px-3 flex flex-wrap items-center justify-between gap-2">
        <Text className="font-medium">ชำระภายใน</Text>
        <Text className="font-bold text-red-500 tabular-nums">
          {hms
            ? isTimerExpired
              ? "หมดเวลา"
              : `${hms.h}:${hms.m}:${hms.s}`
            : "—"}
        </Text>
      </div>

      {lock.mode === "qr" && lock.qrImageUrl && (
        <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center min-h-64">
          <img
            src={lock.qrImageUrl}
            alt="PromptPay QR"
            className="mx-auto h-64 w-64 object-contain"
          />
        </div>
      )}

      {lock.mode === "redirect" && lock.redirectUrl && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 flex flex-col items-center gap-3">
          <Text className="text-sm text-gray-600 text-center">
            ระบบจะเปิดหน้าธนาคารหรือแอปเพื่อชำระเงิน
            จากนั้นกลับมาที่หน้านี้เพื่อรอการยืนยัน
          </Text>
          <a
            href={lock.redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "shadow-xs relative inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap border border-transparent transition-colors",
              "min-w-[114px] h-sop-48px py-sop-4px px-sop-32px sop-body-md-medium rounded-sop-36",
              "bg-sop-primary-500 text-sop-neutral-grayfixed-600 border-transparent hover:bg-sop-primary-600"
            )}
          >
            เปิดหน้าชำระเงิน
          </a>
        </div>
      )}

      {lock.mode === "processing" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Text className="text-sm text-amber-900 text-center">
            ระบบกำลังรอการยืนยันจากธนาคาร หน้านี้จะอัปเดตอัตโนมัติ
          </Text>
        </div>
      )}

      {isTimerExpired && lock.qrImageUrl && (
        <Text className="text-center text-sm text-red-600">
          QR หมดเวลาแล้ว หากชำระเงินแล้ว ระบบอาจยังประมวลผลอยู่ — ตรวจสอบได้ที่
          คำสั่งซื้อ
        </Text>
      )}

      <Button type="button" variant="outline" fill onClick={leaveToOrders}>
        ไปที่คำสั่งซื้อของฉัน
      </Button>

      <Text className="text-center text-xs text-gray-400">
        ไม่สามารถกลับไปหน้าชำระเงินเพื่อเปลี่ยนวิธีชำระ (บัตร / QR)
        ในขณะรอชำระนี้
      </Text>
    </main>
  )
}

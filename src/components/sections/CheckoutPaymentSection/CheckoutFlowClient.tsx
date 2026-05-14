"use client"

import {
  clearPromptPayCheckoutLock,
  readPromptPayCheckoutLock,
} from "@/lib/helpers/promptpay-checkout-lock"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  CheckoutPageDataProvider,
  useCheckoutPageData,
} from "./CheckoutPageDataContext"
import { CheckoutElementsSecretProvider } from "./CheckoutElementsSecretContext"
import { MarketplaceCheckoutProvider } from "./MarketplaceCheckoutContext"
import {
  CheckoutPaymentProvider,
  useCheckoutPayment,
} from "./CheckoutPaymentContext"
import { CheckoutPaymentSection } from "./CheckoutPaymentSection"
import { CheckoutSummarySection } from "@/components/sections/CheckoutSummarySection"
import { CheckoutDiscountSection } from "@/components/sections/CheckoutDiscountSection/CheckoutDiscountSection"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartReview from "@/components/sections/CartReview/CartReview"
import { StripePaymentElementsBoundary } from "@/components/organisms/PaymentContainer/StripePaymentElementsBoundary"
import { RouteLoadingSpinnerBlock } from "@/components/atoms/RouteLoadingFallback/RouteLoadingSpinnerBlock"
import { Cart } from "@/types/cart"
import { Text } from "@medusajs/ui"
import type { CheckoutPageInitialData } from "@/lib/data/checkout-page"
import { useCheckoutCartQuery } from "@/hooks/useCheckoutCartQuery"

type CheckoutFlowClientProps = {
  cart: Cart
  initialData: CheckoutPageInitialData
}

export default function CheckoutFlowClient({
  cart,
  initialData,
}: CheckoutFlowClientProps) {
  const regionId = cart.region_id ?? cart.region?.id ?? null
  const checkoutCartQuery = useCheckoutCartQuery({
    cartId: cart.id,
    initialData: cart,
  })
  const checkoutCart = checkoutCartQuery.data ?? cart

  return (
    <CheckoutElementsSecretProvider>
      <MarketplaceCheckoutProvider>
        <CheckoutPageDataProvider
          cartId={checkoutCart.id}
          regionId={regionId}
          initialData={initialData}
        >
          <CheckoutFlowInner cart={checkoutCart} />
        </CheckoutPageDataProvider>
      </MarketplaceCheckoutProvider>
    </CheckoutElementsSecretProvider>
  )
}

function CheckoutFlowInner({ cart }: { cart: Cart }) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || "th"
  const { error, isLoading } = useCheckoutPageData()

  useEffect(() => {
    const lock = readPromptPayCheckoutLock()
    if (lock?.cartId === cart.id) {
      router.replace(`/${lock.locale}/checkout/promptpay`)
      return
    }
    if (lock && lock.cartId !== cart.id) {
      clearPromptPayCheckoutLock()
    }
    if (cart.completed_at) {
      router.replace(`/${locale}/user/orders`)
    }
  }, [cart.id, cart.completed_at, locale, router])

  return (
    <CheckoutPaymentProvider>
      <CheckoutPaymentSubmittingOverlay />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-800">{error}</Text>
        </div>
      )}

      {isLoading && (
        <div
          className="fixed inset-0 z-45 flex flex-col items-center justify-center gap-3 bg-sop-base-white/96 px-6"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <RouteLoadingSpinnerBlock variant="compact" />
          <Text className="text-xs text-gray-500 text-center">
            กำลังเตรียมหน้าชำระเงิน…
          </Text>
        </div>
      )}

      {!isLoading && (
        <>
          <CartAddressSection cart={cart} />

          <CartReview cart={cart} />

          <CheckoutDiscountSection cart={cart} />

          <StripePaymentElementsBoundary cart={cart}>
            <CheckoutPaymentSection cart={cart} />
            <CheckoutSummarySection cart={cart} />
          </StripePaymentElementsBoundary>
        </>
      )}
    </CheckoutPaymentProvider>
  )
}

function CheckoutPaymentSubmittingOverlay() {
  const isPaymentSubmitting = useCheckoutPayment(
    (state) => state.isPaymentSubmitting
  )
  const paymentSubmissionMessage = useCheckoutPayment(
    (state) => state.paymentSubmissionMessage
  )

  if (!isPaymentSubmitting) {
    return null
  }

  const steps = [
    "ตรวจสอบคำสั่งซื้อ",
    "เตรียมการชำระเงิน",
    "ยืนยันกับธนาคาร",
    "สร้างคำสั่งซื้อ",
    "เปิดหน้าสำเร็จ",
  ]

  const resolveStepIndex = (message: string | null) => {
    const normalized = message?.trim() ?? ""

    if (
      normalized.includes("ตรวจสอบ") ||
      normalized.includes("กรอก") ||
      normalized.includes("ที่อยู่")
    ) {
      return 0
    }

    if (
      normalized.includes("เตรียม") ||
      normalized.includes("บันทึกบัตร") ||
      normalized.includes("QR")
    ) {
      return 1
    }

    if (normalized.includes("ยืนยันการชำระเงิน")) {
      return 2
    }

    if (normalized.includes("สร้างคำสั่งซื้อ")) {
      return 3
    }

    if (normalized.includes("หน้าสำเร็จ") || normalized.includes("พาไป")) {
      return 4
    }

    return 1
  }

  const currentStepIndex = resolveStepIndex(paymentSubmissionMessage)
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/18 px-6 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-sop-primary-100 animate-ping opacity-75" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sop-primary-500 to-sop-additionalblue-400 text-white shadow-lg">
              <span
                className="h-7 w-7 rounded-full border-2 border-white/40 border-t-white animate-spin"
                aria-hidden
              />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <Text className="sop-body-md-medium text-sop-neutral-gray-300">
              กำลังดำเนินการชำระเงิน
            </Text>
            <Text className="mt-1 text-sm text-sop-neutral-gray-400">
              {paymentSubmissionMessage || "กำลังเตรียมการชำระเงิน…"}
            </Text>
          </div>
        </div>

        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sop-primary-500 to-sop-additionalblue-400 transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-5 space-y-2">
          {steps.map((step, index) => {
            const isDone = index < currentStepIndex
            const isCurrent = index === currentStepIndex

            return (
              <div
                key={step}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 px-3 py-2"
              >
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    isDone
                      ? "bg-emerald-500"
                      : isCurrent
                        ? "bg-sop-primary-500"
                        : "bg-slate-200",
                  ].join(" ")}
                />
                <Text
                  className={[
                    "text-sm",
                    isDone || isCurrent
                      ? "text-sop-neutral-gray-300"
                      : "text-sop-neutral-gray-400",
                  ].join(" ")}
                >
                  {step}
                </Text>
              </div>
            )
          })}
        </div>

        <Text className="mt-4 text-center text-xs text-sop-neutral-gray-400">
          กรุณาอย่าปิดหน้าต่างนี้จนกว่าระบบจะยืนยันเสร็จและพาไปหน้าสำเร็จ
        </Text>
      </div>
    </div>
  )
}

"use client"

import {
  clearPromptPayCheckoutLock,
  readPromptPayCheckoutLock,
} from "@/lib/helpers/promptpay-checkout-lock"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
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
import { GuestOTPDialog } from "@/components/organisms/GuestOTPDialog/GuestOTPDialog"
import { StripePaymentElementsBoundary } from "@/components/organisms/PaymentContainer/StripePaymentElementsBoundary"
import { RouteLoadingSpinnerBlock } from "@/components/atoms/RouteLoadingFallback/RouteLoadingSpinnerBlock"
import { mergeAnonymousCartIntoCustomerAfterLogin } from "@/lib/data/local-customer-cart"
import { getStripePromise } from "@/lib/stripe/get-stripe"
import { Cart } from "@/types/cart"
import { Text } from "@medusajs/ui"
import type { CheckoutPageInitialData } from "@/lib/data/checkout-page"

type CheckoutFlowClientProps = {
  cart: Cart
  initialData: CheckoutPageInitialData
}

export default function CheckoutFlowClient({
  cart,
  initialData,
}: CheckoutFlowClientProps) {
  const regionId = cart.region_id ?? cart.region?.id ?? null

  return (
    <CheckoutElementsSecretProvider>
      <MarketplaceCheckoutProvider>
        <CheckoutPageDataProvider
          cartId={cart.id}
          regionId={regionId}
          initialData={initialData}
        >
          <CheckoutFlowInner cart={cart} />
        </CheckoutPageDataProvider>
      </MarketplaceCheckoutProvider>
    </CheckoutElementsSecretProvider>
  )
}

function CheckoutFlowInner({ cart }: { cart: Cart }) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) || "th"
  const { customer, refetch, error, isLoading, isRefreshing } =
    useCheckoutPageData()
  const [isOTPVerified, setIsOTPVerified] = useState(false)
  const [verifiedPhone, setVerifiedPhone] = useState("")
  const [, startRefreshTransition] = useTransition()

  const stripePromise = getStripePromise()
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null)

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

  useEffect(() => {
    if (!stripePromise) return
    let cancelled = false
    stripePromise
      .then(() => {
        if (!cancelled) setStripeLoadError(null)
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setStripeLoadError(
            (e as Error)?.message ?? "ไม่สามารถโหลดระบบชำระเงินได้"
          )
        }
      })
    return () => {
      cancelled = true
    }
  }, [stripePromise])

  const showGuestOTPDialog = !customer && !isOTPVerified
  const authGateOk = Boolean(customer) || isOTPVerified
  const dataBootstrapPending = isLoading || (isOTPVerified && isRefreshing)

  const showCheckoutShell = authGateOk && !dataBootstrapPending

  const handleGuestVerified = useCallback(
    async (phone: string) => {
      setVerifiedPhone(phone)
      setIsOTPVerified(true)
      await mergeAnonymousCartIntoCustomerAfterLogin()
      await refetch()
      startRefreshTransition(() => {
        router.refresh()
      })
    },
    [refetch, router, startRefreshTransition]
  )

  return (
    <CheckoutPaymentProvider>
      <CheckoutPaymentSubmittingOverlay />

      <GuestOTPDialog
        isOpen={showGuestOTPDialog}
        onVerified={handleGuestVerified}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <Text className="text-sm text-red-800">{error}</Text>
        </div>
      )}

      {showGuestOTPDialog && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-sop-base-white/97 px-6"
          aria-busy={isLoading}
          aria-live="polite"
        >
          {isLoading && <RouteLoadingSpinnerBlock variant="compact" />}
          <Text className="text-center text-sop-neutral-gray-300 sop-body-sm-regular max-w-sm">
            ยืนยันเบอร์โทรศัพท์เพื่อดำเนินการชำระเงิน
          </Text>
        </div>
      )}

      {authGateOk && dataBootstrapPending && (
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

      {showCheckoutShell && stripeLoadError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4"
          role="alert"
        >
          <Text className="text-sm text-red-800">{stripeLoadError}</Text>
        </div>
      )}

      {showCheckoutShell && (
        <>
          <CartAddressSection cart={cart} verifiedPhone={verifiedPhone} />

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

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-3 bg-sop-base-white/96 px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <RouteLoadingSpinnerBlock variant="compact" />
      <Text className="text-center text-sop-neutral-gray-300 sop-body-sm-regular max-w-sm">
        {paymentSubmissionMessage || "กำลังดำเนินการชำระเงิน…"}
      </Text>
      <Text className="text-center text-xs text-sop-neutral-gray-400 max-w-sm">
        กรุณาอย่าปิดหน้าต่างนี้จนกว่าระบบจะพาไปหน้าสำเร็จ
      </Text>
    </div>
  )
}

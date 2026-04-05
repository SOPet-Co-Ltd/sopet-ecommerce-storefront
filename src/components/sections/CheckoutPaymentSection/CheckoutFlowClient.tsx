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
} from "@/app/[locale]/(checkout)/_providers/checkout-page-data-context"
import { CheckoutPaymentProvider } from "./CheckoutPaymentContext"
import { CheckoutPaymentSection } from "./CheckoutPaymentSection"
import { CheckoutSummarySection } from "@/components/sections/CheckoutSummarySection"
import { CheckoutDiscountSection } from "@/components/sections/CheckoutDiscountSection/CheckoutDiscountSection"
import { CartAddressSection } from "@/components/sections/CartAddressSection/CartAddressSection"
import CartReview from "@/components/sections/CartReview/CartReview"
import { GuestOTPDialog } from "@/components/organisms/GuestOTPDialog/GuestOTPDialog"
import { StripePaymentElementsBoundary } from "@/components/organisms/PaymentContainer/StripePaymentElementsBoundary"
import { RouteLoadingSpinnerBlock } from "@/components/atoms/RouteLoadingFallback/RouteLoadingSpinnerBlock"
import { mergeAnonymousCartIntoCustomerAfterLogin } from "@/lib/data/local-customer-cart"
import {
  getStripePromise,
  getStripePublishableKey,
} from "@/lib/stripe/get-stripe"
import { Cart } from "@/types/cart"
import { Text } from "@medusajs/ui"

type CheckoutFlowClientProps = {
  cart: Cart
}

export default function CheckoutFlowClient({ cart }: CheckoutFlowClientProps) {
  const regionId = cart.region_id ?? cart.region?.id ?? null

  return (
    <CheckoutPageDataProvider cartId={cart.id} regionId={regionId}>
      <CheckoutFlowInner cart={cart} />
    </CheckoutPageDataProvider>
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
  const stripeKey = getStripePublishableKey()
  const [stripeBootReady, setStripeBootReady] = useState(!stripePromise)
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
      .finally(() => {
        if (!cancelled) setStripeBootReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [stripePromise])

  const showGuestOTPDialog = !customer && !isOTPVerified
  const authGateOk = Boolean(customer) || isOTPVerified
  const dataBootstrapPending = isLoading || (isOTPVerified && isRefreshing)
  const stripeBootstrapPending = Boolean(
    stripeKey && stripePromise && !stripeBootReady
  )

  const showFullCheckout =
    authGateOk && !dataBootstrapPending && !stripeBootstrapPending

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

      {authGateOk && !showFullCheckout && (
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

      {showFullCheckout && stripeLoadError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 mb-4"
          role="alert"
        >
          <Text className="text-sm text-red-800">{stripeLoadError}</Text>
        </div>
      )}

      {showFullCheckout && (
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

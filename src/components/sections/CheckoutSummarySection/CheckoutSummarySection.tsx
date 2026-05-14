"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/helpers/money"
import { Text } from "@medusajs/ui"
import {
  clearCheckoutCartCookie,
  completeMarketplaceOrder,
  setAddresses,
} from "@/lib/data/cart"
import { useMarketplaceStripePaymentInit } from "@/hooks/useMarketplaceStripePaymentInit"
import {
  collectionRequiresPayment,
  countPayableMarketplaceSlices,
  findStripeSessionForSlice,
  getMarketplaceSessionsInOrder,
} from "@/lib/helpers/marketplace-checkout-ui"
import { getOrderIdFromPlaceOrderResponse } from "@/lib/helpers/place-order-response"
import { writeOrderPromptPayContinuity } from "@/lib/helpers/order-promptpay-continuity"
import { writePromptPayCheckoutLock } from "@/lib/helpers/promptpay-checkout-lock"
import { checkoutPaymentFingerprint } from "@/lib/helpers/checkout-payment-fingerprint"
import { captureOrderPayment } from "@/lib/data/orders"
import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import {
  formatCountdownHms,
  getPromptPayCheckoutClickDeadlineMs,
} from "@/lib/helpers/pending-payment-expiry"
import { addCustomerAddress } from "@/lib/data/customer"
import { toast } from "@/lib/helpers/toast"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { useMarketplaceCheckout } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import { useCheckoutPageData } from "@/components/sections/CheckoutPaymentSection/CheckoutPageDataContext"
import { useCheckoutElementsSecret } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useParams, useRouter } from "next/navigation"

type CheckoutSummarySectionProps = {
  cart: Cart | null
}

export const CheckoutSummarySection = ({
  cart,
}: CheckoutSummarySectionProps) => {
  const params = useParams()
  const checkoutLocale = (params?.locale as string) || "th"
  const { customer, shippingMethods, paymentMethods } = useCheckoutPageData()
  const method = useCheckoutPayment((state) => state.method)
  const cardComplete = useCheckoutPayment((state) => state.cardComplete)
  const getCardComplete = useCheckoutPayment((state) => state.getCardComplete)
  const cardError = useCheckoutPayment((state) => state.cardError)
  const selectedAddress = useCheckoutPayment((state) => state.selectedAddress)
  const selectedEmail = useCheckoutPayment((state) => state.selectedEmail)
  const shippingAddressIsDraft = useCheckoutPayment(
    (state) => state.shippingAddressIsDraft
  )
  const draftAddress = useCheckoutPayment((state) => state.draftAddress)
  const useNewCard = useCheckoutPayment((state) => state.useNewCard)
  const selectedPaymentMethodId = useCheckoutPayment(
    (state) => state.selectedPaymentMethodId
  )
  const submitting = useCheckoutPayment((state) => state.isPaymentSubmitting)
  const startPaymentSubmission = useCheckoutPayment(
    (state) => state.startPaymentSubmission
  )
  const setPaymentSubmissionMessage = useCheckoutPayment(
    (state) => state.setPaymentSubmissionMessage
  )
  const finishPaymentSubmission = useCheckoutPayment(
    (state) => state.finishPaymentSubmission
  )
  const [error, setError] = useState<string | null>(null)
  const [localSessions, setLocalSessions] = useState<Record<string, any>>({})
  const marketplacePaymentInitError = useCheckoutElementsSecret(
    (state) => state.marketplacePaymentInitError
  )
  const mpCheckout = useMarketplaceCheckout((state) => state.mpCheckout)
  const sliceCollectionsById = useMarketplaceCheckout(
    (state) => state.sliceCollectionsById
  )
  const {
    promptpayProviderId,
    marketplaceInitializing,
    runMarketplaceInitIfNeeded,
    retryInit,
  } = useMarketplaceStripePaymentInit({ cart, method, paymentMethods })
  const cartPaymentStateFingerprint = useMemo(
    () => checkoutPaymentFingerprint(cart),
    [cart]
  )

  useEffect(() => {
    setLocalSessions({})
    setError(null)
  }, [cartPaymentStateFingerprint])

  if (!cart) return null

  const getNumericAmount = (value: unknown): number => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (value && typeof value === "object") {
      const numericValue = (value as { numeric_?: unknown }).numeric_
      if (typeof numericValue === "number") return numericValue
      if (typeof numericValue === "string") {
        const parsed = Number(numericValue)
        return Number.isFinite(parsed) ? parsed : 0
      }
      const amountValue = (value as { amount?: unknown }).amount
      if (typeof amountValue === "number") return amountValue
      if (typeof amountValue === "string") {
        const parsed = Number(amountValue)
        return Number.isFinite(parsed) ? parsed : 0
      }
    }
    return 0
  }

  const normalizeComparable = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : ""

  const addressesMatch = (
    left:
      | HttpTypes.StoreCustomerAddress
      | HttpTypes.StoreCartAddress
      | null
      | undefined,
    right:
      | HttpTypes.StoreCustomerAddress
      | HttpTypes.StoreCartAddress
      | null
      | undefined
  ) => {
    if (!left || !right) {
      return false
    }

    return (
      normalizeComparable(left.first_name) ===
        normalizeComparable(right.first_name) &&
      normalizeComparable(left.last_name) ===
        normalizeComparable(right.last_name) &&
      normalizeComparable(left.address_1) ===
        normalizeComparable(right.address_1) &&
      normalizeComparable(left.address_2) ===
        normalizeComparable(right.address_2) &&
      normalizeComparable(left.city) === normalizeComparable(right.city) &&
      normalizeComparable(left.province) ===
        normalizeComparable(right.province) &&
      normalizeComparable(left.postal_code) ===
        normalizeComparable(right.postal_code) &&
      normalizeComparable(left.country_code || "th") ===
        normalizeComparable(right.country_code || "th") &&
      normalizeComparable(left.phone) === normalizeComparable(right.phone)
    )
  }

  const emailMatchesCart = (email: string | null | undefined) =>
    normalizeComparable(email) === normalizeComparable(cart?.email || "")

  const itemSubtotal = getNumericAmount(
    cart.item_subtotal ?? cart.subtotal ?? 0
  )
  const shippingTotalFromCart = getNumericAmount(cart.shipping_total)
  const shippingOptionAmountMap = new Map(
    (shippingMethods || []).map((method) => [
      method.id,
      getNumericAmount(method.amount),
    ])
  )
  const shippingTotalFromMethods = (cart.shipping_methods || []).reduce(
    (sum, method) => {
      const methodAmount = getNumericAmount(method.amount)
      if (methodAmount > 0) {
        return sum + methodAmount
      }

      const fallbackAmount = method.shipping_option_id
        ? shippingOptionAmountMap.get(method.shipping_option_id)
        : undefined
      return sum + getNumericAmount(fallbackAmount)
    },
    0
  )
  const shippingTotalFromDefaultOptions =
    (cart.shipping_methods?.length || 0) > 0
      ? 0
      : (() => {
          const sellerIds = new Set<string>()

          ;(cart.items || []).forEach((item) => {
            const sellerId = (item as any)?.product?.seller?.id as
              | string
              | undefined
            if (sellerId) {
              sellerIds.add(sellerId)
            }
          })

          if (sellerIds.size === 0) return 0

          let sum = 0
          sellerIds.forEach((sellerId) => {
            const defaultOption = (shippingMethods || []).find(
              (method) => method.seller_id === sellerId
            )
            sum += getNumericAmount(defaultOption?.amount)
          })

          return sum
        })()
  const shippingTotal =
    shippingTotalFromCart > 0
      ? shippingTotalFromCart
      : shippingTotalFromMethods > 0
        ? shippingTotalFromMethods
        : shippingTotalFromDefaultOptions
  const discountTotal = getNumericAmount(cart.discount_total || 0)
  const total = itemSubtotal + shippingTotal - discountTotal
  const currencyCode = cart.currency_code || "thb"

  const syncShippingMethodBeforePayment = async () => {
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      throw new Error("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน")
    }
  }

  const sliceNeedsPayment = (
    slice: { payment_collection_id: string; raw_total?: unknown } | undefined,
    byId: Record<string, HttpTypes.StorePaymentCollection | undefined>
  ) => {
    if (!slice) {
      return false
    }
    if (collectionRequiresPayment(byId[slice.payment_collection_id])) {
      return true
    }
    const rawTotal = Number(slice.raw_total ?? 0)
    return Number.isFinite(rawTotal) && rawTotal > 0
  }

  const firstPayableSlice = mpCheckout?.slices.find((slice) =>
    sliceNeedsPayment(slice, sliceCollectionsById)
  )
  const firstSliceCollection =
    (firstPayableSlice ?? mpCheckout?.slices[0])
      ? sliceCollectionsById[
          (firstPayableSlice ?? mpCheckout?.slices[0])!.payment_collection_id
        ]
      : undefined

  const marketplacePromptpaySession =
    mpCheckout && promptpayProviderId
      ? findStripeSessionForSlice(
          firstSliceCollection,
          "promptpay",
          promptpayProviderId
        )
      : undefined

  const fallbackPromptpaySession = cart.payment_collection
    ? findStripeSessionForSlice(cart.payment_collection, "promptpay")
    : undefined

  const promptpaySession =
    marketplacePromptpaySession || fallbackPromptpaySession

  const uniqueSellerCount = new Set(
    (cart.items ?? [])
      .map(
        (i) =>
          (i as { product?: { seller?: { id?: string } } })?.product?.seller?.id
      )
      .filter(Boolean)
  ).size

  const multiSellerPromptPayBlocked =
    method === "qrcode" && uniqueSellerCount > 1

  const fallbackAddress: HttpTypes.StoreCartAddress | null =
    (cart.billing_address ||
      cart.shipping_address ||
      selectedAddress ||
      null) as HttpTypes.StoreCartAddress | null
  const fallbackEmail = cart?.email || customer?.email || selectedEmail || ""
  const cartSnapshot = {
    customerId: cart.customer_id ?? customer?.id ?? null,
    email: cart.email ?? null,
    customerPhone:
      ((cart as { customer?: { phone?: string | null } }).customer?.phone ??
        customer?.phone ??
        null) ||
      null,
    customerEmail:
      ((cart as { customer?: { email?: string | null } }).customer?.email ??
        customer?.email ??
        null) ||
      null,
    promotionCodes:
      (cart.promotions ?? [])
        .map((promotion) => promotion.code)
        .filter(
          (code): code is string => typeof code === "string" && code.length > 0
        ) ?? [],
  }

  const addressReadyForButton = (() => {
    if (!cart) return false

    if (shippingAddressIsDraft) {
      return Boolean(
        draftAddress.first_name?.trim() &&
        draftAddress.address_1?.trim() &&
        draftAddress.city?.trim() &&
        draftAddress.postal_code?.trim() &&
        draftAddress.phone?.trim()
      )
    }

    const addressForValidation =
      (selectedAddress as
        | HttpTypes.StoreCustomerAddress
        | HttpTypes.StoreCartAddress
        | null) ||
      (cart.shipping_address as
        | HttpTypes.StoreCustomerAddress
        | HttpTypes.StoreCartAddress
        | null) ||
      (cart.billing_address as
        | HttpTypes.StoreCustomerAddress
        | HttpTypes.StoreCartAddress
        | null) ||
      null

    if (!addressForValidation) {
      return false
    }

    return Boolean(
      addressForValidation.first_name?.trim() &&
      addressForValidation.address_1?.trim() &&
      addressForValidation.city?.trim() &&
      addressForValidation.postal_code?.trim() &&
      addressForValidation.phone?.trim()
    )
  })()

  const notReady = !cart

  const disabledBase = submitting || notReady || !addressReadyForButton

  const runBeforePaymentSteps = async (): Promise<string | null> => {
    if (shippingAddressIsDraft) {
      const hasRequiredDraft =
        draftAddress.first_name?.trim() &&
        draftAddress.address_1?.trim() &&
        draftAddress.city?.trim() &&
        draftAddress.postal_code?.trim() &&
        draftAddress.phone?.trim()
      if (!hasRequiredDraft) {
        return "กรุณากรอกที่อยู่ให้ครบถ้วน"
      }
    } else {
      const addressForValidation =
        (selectedAddress as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        (cart.shipping_address as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        (cart.billing_address as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        null

      const hasRequiredSaved =
        addressForValidation?.first_name?.trim() &&
        addressForValidation?.address_1?.trim() &&
        addressForValidation?.city?.trim() &&
        addressForValidation?.postal_code?.trim() &&
        addressForValidation?.phone?.trim()

      if (!hasRequiredSaved) {
        return "กรุณากรอกที่อยู่ในการจัดส่ง"
      }
    }

    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      return "กรุณาเลือกวิธีจัดส่ง"
    }

    if (shippingAddressIsDraft && draftAddress) {
      const addressFormData = new FormData()
      addressFormData.set("first_name", draftAddress.first_name)
      addressFormData.set("last_name", draftAddress.last_name)
      addressFormData.set("address_1", draftAddress.address_1)
      addressFormData.set("address_2", draftAddress.address_2 || "")
      addressFormData.set("city", draftAddress.city)
      addressFormData.set("province", draftAddress.province || "")
      addressFormData.set("postal_code", draftAddress.postal_code)
      addressFormData.set("country_code", "th")
      addressFormData.set("phone", draftAddress.phone)
      addressFormData.set("company", "")
      addressFormData.set("address_name", "")
      addressFormData.set("isDefaultBilling", "false")
      addressFormData.set("isDefaultShipping", "true")
      const createResult = await addCustomerAddress(addressFormData)
      if (createResult?.success === false && createResult?.error) {
        return createResult.error
      }

      const draftCartAddress = {
        first_name: draftAddress.first_name,
        last_name: draftAddress.last_name,
        address_1: draftAddress.address_1,
        address_2: draftAddress.address_2 || "",
        city: draftAddress.city,
        province: draftAddress.province || "",
        postal_code: draftAddress.postal_code,
        country_code: "th",
        phone: draftAddress.phone,
      } as HttpTypes.StoreCartAddress
      const nextEmail = customer?.email || cart?.email || ""

      if (
        addressesMatch(cart.shipping_address, draftCartAddress) &&
        emailMatchesCart(nextEmail)
      ) {
        return null
      }

      const cartAddressFormData = new FormData()
      cartAddressFormData.set(
        "shipping_address.first_name",
        draftAddress.first_name
      )
      cartAddressFormData.set(
        "shipping_address.last_name",
        draftAddress.last_name
      )
      cartAddressFormData.set(
        "shipping_address.address_1",
        draftAddress.address_1
      )
      cartAddressFormData.set(
        "shipping_address.address_2",
        draftAddress.address_2 || ""
      )
      cartAddressFormData.set("shipping_address.city", draftAddress.city)
      cartAddressFormData.set(
        "shipping_address.province",
        draftAddress.province || ""
      )
      cartAddressFormData.set(
        "shipping_address.postal_code",
        draftAddress.postal_code
      )
      cartAddressFormData.set("shipping_address.country_code", "th")
      cartAddressFormData.set("shipping_address.phone", draftAddress.phone)
      cartAddressFormData.set("shipping_address.company", "")
      if (customer?.email || cart?.email) {
        cartAddressFormData.set("email", customer?.email || cart?.email || "")
      }
      const setAddrResult = await setAddresses(null, cartAddressFormData)
      if (typeof setAddrResult === "string") {
        return setAddrResult
      }
    } else {
      const address =
        (selectedAddress as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        (cart.shipping_address as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        (cart.billing_address as
          | HttpTypes.StoreCustomerAddress
          | HttpTypes.StoreCartAddress
          | null) ||
        null

      if (!address) {
        return "กรุณากรอกที่อยู่ในการจัดส่ง"
      }

      const nextEmail = customer?.email || cart?.email || selectedEmail || ""

      if (
        addressesMatch(cart.shipping_address, address) &&
        emailMatchesCart(nextEmail)
      ) {
        return null
      }

      const cartAddressFormData = new FormData()
      cartAddressFormData.set(
        "shipping_address.first_name",
        address.first_name || ""
      )
      cartAddressFormData.set(
        "shipping_address.last_name",
        address.last_name || ""
      )
      cartAddressFormData.set(
        "shipping_address.address_1",
        address.address_1 || ""
      )
      cartAddressFormData.set(
        "shipping_address.address_2",
        address.address_2 || ""
      )
      cartAddressFormData.set("shipping_address.city", address.city || "")
      cartAddressFormData.set(
        "shipping_address.province",
        address.province || ""
      )
      cartAddressFormData.set(
        "shipping_address.postal_code",
        address.postal_code || ""
      )
      cartAddressFormData.set(
        "shipping_address.country_code",
        address.country_code || "th"
      )
      cartAddressFormData.set("shipping_address.phone", address.phone || "")
      cartAddressFormData.set("shipping_address.company", "")
      if (customer?.email || cart?.email || selectedEmail) {
        cartAddressFormData.set(
          "email",
          customer?.email || cart?.email || selectedEmail || ""
        )
      }
      const setAddrResult = await setAddresses(null, cartAddressFormData)
      if (typeof setAddrResult === "string") {
        return setAddrResult
      }
    }

    return null
  }

  return (
    <div className="bg-white p-6">
      <div className="flex flex-col gap-4 w-full md:w-1/2 ml-auto">
        <div className="flex justify-between items-center text-gray-900">
          <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
            รายการสั่งซื้อทั้งหมด
          </Text>
          <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
            {convertToLocale({
              amount: itemSubtotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        <div className="flex justify-between items-center text-gray-900">
          <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
            ค่าจัดส่ง
          </Text>
          <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
            {convertToLocale({
              amount: shippingTotal,
              currency_code: currencyCode,
            })}
          </Text>
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between items-center text-green-600">
            <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
              ส่วนลด
            </Text>
            <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
              -{" "}
              {convertToLocale({
                amount: discountTotal,
                currency_code: currencyCode,
              })}
            </Text>
          </div>
        )}

        <div className="border-b border-gray-100 my-2" />

        <div className="flex justify-between items-center">
          <Text className="sop-body-sm-regular md:sop-body-md-regular text-sop-neutral-gray-300">
            ยอดชำระเงินทั้งหมด
          </Text>
          <div className="bg-red-400 text-white px-4 py-1 rounded-xl sop-body-md-medium md:sop-body-lg-medium">
            {convertToLocale({
              amount: total,
              currency_code: currencyCode,
            })}
          </div>
        </div>

        {method === "qrcode" ? (
          <QrSummaryPayButton
            cartId={cart.id}
            locale={checkoutLocale}
            promptpayProviderId={promptpayProviderId}
            billingAddress={fallbackAddress}
            email={fallbackEmail}
            totalAmount={total}
            currencyCode={currencyCode}
            disabled={
              disabledBase ||
              multiSellerPromptPayBlocked ||
              marketplaceInitializing
            }
            submitting={submitting}
            startSubmitting={startPaymentSubmission}
            setSubmittingMessage={setPaymentSubmissionMessage}
            finishSubmitting={finishPaymentSubmission}
            setError={setError}
            syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
            runMarketplaceInitIfNeeded={runMarketplaceInitIfNeeded}
            onBeforePayment={runBeforePaymentSteps}
            toastError={toast.error}
            cartSnapshot={cartSnapshot}
          />
        ) : method === "card" ? (
          <CardSummaryPayButton
            disabled={disabledBase || !cardComplete || marketplaceInitializing}
            submitting={submitting}
            startSubmitting={startPaymentSubmission}
            setSubmittingMessage={setPaymentSubmissionMessage}
            finishSubmitting={finishPaymentSubmission}
            setError={setError}
            syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
            onBeforePayment={runBeforePaymentSteps}
            toastError={toast.error}
            cartSnapshot={cartSnapshot}
          />
        ) : (
          <ManualSummaryPayButton
            disabled={disabledBase || marketplaceInitializing}
            submitting={submitting}
            startSubmitting={startPaymentSubmission}
            setSubmittingMessage={setPaymentSubmissionMessage}
            finishSubmitting={finishPaymentSubmission}
            setError={setError}
            syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
            onBeforePayment={runBeforePaymentSteps}
            toastError={toast.error}
            cartSnapshot={cartSnapshot}
          />
        )}
        {cardError && (
          <Text className="text-red-500 text-center text-sm">{cardError}</Text>
        )}
        {marketplacePaymentInitError && (
          <div className="flex flex-col items-center gap-2">
            <Text className="text-red-500 text-center text-sm">
              {marketplacePaymentInitError}
            </Text>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => void retryInit()}
              disabled={marketplaceInitializing}
            >
              ลองอีกครั้ง
            </Button>
          </div>
        )}
        {multiSellerPromptPayBlocked && method === "qrcode" && (
          <Text className="text-amber-700 text-center text-sm">
            คำสั่งซื้อจากหลายร้าน: กรุณาใช้บัตรเครดิต/เดบิตเพื่อชำระเงิน
          </Text>
        )}
        {error && (
          <Text className="text-red-500 text-center text-sm">{error}</Text>
        )}
      </div>
    </div>
  )
}

type CommonButtonProps = {
  disabled: boolean
  submitting: boolean
  startSubmitting: (message?: string | null) => void
  setSubmittingMessage: (message: string | null) => void
  finishSubmitting: () => void
  setError: (error: string | null) => void
  syncShippingMethodBeforePayment: () => Promise<void>
  onBeforePayment?: () => Promise<string | null>
  toastError?: (opts: { title: string; description?: string }) => void
  cartSnapshot?: {
    customerId?: string | null
    email?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    promotionCodes?: string[] | null
  }
}

const CardSummaryPayButton = ({
  disabled,
  submitting,
  startSubmitting,
  setSubmittingMessage,
  finishSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  onBeforePayment,
  toastError,
  cartSnapshot,
}: CommonButtonProps) => {
  const router = useRouter()

  const handlePayment = async () => {
    startSubmitting("กำลังตรวจสอบข้อมูลคำสั่งซื้อ…")
    setError(null)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          finishSubmitting()
          return
        }
      }

      setSubmittingMessage("กำลังเตรียมการชำระเงิน…")
      await syncShippingMethodBeforePayment()

      setSubmittingMessage("กำลังสร้างคำสั่งซื้อ…")
      const res = await completeMarketplaceOrder(undefined, {
        redirect: false,
        cartSnapshot,
      })
      const orderId = getOrderIdFromPlaceOrderResponse(res)
      if (orderId) {
        setSubmittingMessage("กำลังพาไปหน้าสำเร็จ…")
        await clearCheckoutCartCookie()
        router.push(`/order/${orderId}/confirmed`)
        return
      }
      if (!res?.ok) {
        throw new Error(res?.error?.message || "Payment failed")
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
      finishSubmitting()
    }
  }

  return (
    <Button
      size="lg"
      variant="primary"
      fill
      onClick={handlePayment}
      loading={submitting}
      disabled={disabled}
    >
      ชำระเงิน
    </Button>
  )
}

const ManualSummaryPayButton = ({
  disabled,
  submitting,
  startSubmitting,
  setSubmittingMessage,
  finishSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  onBeforePayment,
  toastError,
  cartSnapshot,
}: CommonButtonProps) => {
  const router = useRouter()

  const handlePayment = async () => {
    startSubmitting("กำลังตรวจสอบข้อมูลคำสั่งซื้อ…")
    setError(null)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          finishSubmitting()
          return
        }
      }
      setSubmittingMessage("กำลังสร้างคำสั่งซื้อ…")
      await syncShippingMethodBeforePayment()
      const res = await completeMarketplaceOrder(undefined, {
        redirect: false,
        cartSnapshot,
      })
      const orderId = getOrderIdFromPlaceOrderResponse(res)
      if (orderId) {
        setSubmittingMessage("กำลังพาไปหน้าสำเร็จ…")
        router.push(`/order/${orderId}/confirmed`)
        return
      }
      if (!res?.ok) {
        throw new Error(res?.error?.message || "Payment failed")
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
      finishSubmitting()
    }
  }

  return (
    <Button
      size="lg"
      variant="primary"
      fill
      onClick={handlePayment}
      loading={submitting}
      disabled={disabled}
    >
      ชำระเงิน
    </Button>
  )
}

const QrSummaryPayButton = ({
  cartId,
  locale,
  promptpayProviderId,
  billingAddress,
  email,
  totalAmount,
  currencyCode,
  disabled,
  submitting,
  startSubmitting,
  setSubmittingMessage,
  finishSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  runMarketplaceInitIfNeeded,
  onBeforePayment,
  toastError,
  cartSnapshot,
}: CommonButtonProps & {
  cartId: string
  locale: string
  promptpayProviderId?: string
  billingAddress?:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  email?: string
  totalAmount: number
  currencyCode: string
  runMarketplaceInitIfNeeded: (
    methodType: "card" | "promptpay",
    options?: { forceRefresh?: boolean }
  ) => Promise<{ mp: any; byId: any }>
}) => {
  const router = useRouter()
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrExpiresAtMs, setQrExpiresAtMs] = useState<number | null>(null)
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false)
  const orderPlacedRef = useRef(false)

  const { remainingSeconds, isExpired: isTimerExpired } = usePaymentCountdown(
    qrImageUrl && qrExpiresAtMs != null ? qrExpiresAtMs : null
  )
  const hms =
    remainingSeconds != null ? formatCountdownHms(remainingSeconds) : null

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false)
  }

  useEffect(() => {
    if (!qrImageUrl || qrExpiresAtMs == null) return
    if (!isTimerExpired) return

    setError("QR หมดเวลา กรุณาสร้างใหม่อีกครั้ง")
  }, [isTimerExpired, qrExpiresAtMs, qrImageUrl, setError])

  const completePlaceOrderAndNavigate = useCallback(async () => {
    const res = await completeMarketplaceOrder(cartId, {
      redirect: false,
      cartSnapshot,
    })
    const orderId = getOrderIdFromPlaceOrderResponse(res)

    if (!orderId) {
      if (!res?.ok) {
        throw new Error(res?.error?.message || "Payment failed")
      }
      return
    }

    const backoffMs = [0, 900, 2000, 3500]
    let lastErr: string | null = null
    for (let i = 0; i < backoffMs.length; i++) {
      if (backoffMs[i] > 0) {
        await new Promise((r) => setTimeout(r, backoffMs[i]))
      }
      const captureResult = await captureOrderPayment(orderId)
      if (captureResult.success) {
        await clearCheckoutCartCookie()
        router.push(`/order/${orderId}/confirmed`)
        return
      }
      lastErr = captureResult.error ?? null
    }

    toast.error({
      title: "ยืนยันการชำระเงินไม่สำเร็จ",
      description: lastErr ?? undefined,
    })
    throw new Error(lastErr || "Capture failed")
  }, [cartId, cartSnapshot, router])

  const handleGenerateQr = async () => {
    startSubmitting("กำลังเตรียม QR สำหรับชำระเงิน…")
    setError(null)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          finishSubmitting()
          return
        }
      }
      setSubmittingMessage("กำลังบันทึกข้อมูลการจัดส่ง…")
      await syncShippingMethodBeforePayment()

      setSubmittingMessage("กำลังสร้างรายการชำระเงิน…")
      const { mp, byId } = await runMarketplaceInitIfNeeded("promptpay")

      setSubmittingMessage("กำลังสร้างคำสั่งซื้อ…")
      const orderRes = await completeMarketplaceOrder(cartId, {
        redirect: false,
        cartSnapshot,
      })
      const orderIdEarly = getOrderIdFromPlaceOrderResponse(orderRes)
      if (!orderRes.ok || !orderIdEarly) {
        throw new Error(
          (orderRes as { error?: { message?: string } })?.error?.message ||
            "ไม่สามารถสร้างคำสั่งซื้อได้"
        )
      }

      writePromptPayCheckoutLock({
        cartId,
        orderId: orderIdEarly,
        clientSecret: "",
        locale,
        qrImageUrl: null,
        qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
        sessionCreatedAt: null,
        mode: "processing",
      })
      setSubmittingMessage("กำลังพาไปหน้าชำระเงิน…")
      router.push(`/${locale}/checkout/promptpay`)
    } catch (e: unknown) {
      setError((e as Error)?.message || "QR payment failed")
      finishSubmitting()
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <Button
        size="lg"
        variant="primary"
        fill
        onClick={handleGenerateQr}
        loading={submitting}
        disabled={disabled}
      >
        ชำระเงิน
      </Button>
    </div>
  )
}

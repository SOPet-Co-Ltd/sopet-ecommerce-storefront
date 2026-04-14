"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/helpers/money"
import { Text } from "@medusajs/ui"
import { completeMarketplaceOrder, setAddresses } from "@/lib/data/cart"
import { useCheckoutElementsSecret } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { useMarketplaceStripePaymentInit } from "@/hooks/useMarketplaceStripePaymentInit"
import type { MpCheckoutV1 } from "@/types/marketplace-checkout"
import {
  allMarketplaceSlicesAuthorized,
  findStripeSessionForSlice,
  getMarketplaceClientSecretsInOrder,
  isCheckoutSelectableStripeSession,
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
  getPromptPayPendingTtlSeconds,
} from "@/lib/helpers/pending-payment-expiry"
import {
  addCustomerAddress,
  addCustomerPaymentMethod,
} from "@/lib/data/customer"
import { toast } from "@/lib/helpers/toast"
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  CardElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { StripeContext } from "@/components/organisms/PaymentContainer/StripeWrapper"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import { useMarketplaceCheckout } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import { useCheckoutPageData } from "@/app/[locale]/(checkout)/_providers/checkout-page-data-context"
import type { PaymentIntent } from "@stripe/stripe-js"
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
  const {
    method,
    cardholderName,
    cardComplete,
    getCardComplete,
    cardError,
    selectedAddress,
    selectedEmail,
    shippingAddressIsDraft,
    draftAddress,
    useNewCard,
    selectedPaymentMethodId,
  } = useCheckoutPayment()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localSessions, setLocalSessions] = useState<Record<string, any>>({})
  const stripeReady = useContext(StripeContext)
  const { marketplacePaymentInitError } = useCheckoutElementsSecret()
  const { mpCheckout, sliceCollectionsById, mpRef, sliceMapRef } =
    useMarketplaceCheckout()
  const {
    stripeProviderId,
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
    // Validate that at least one shipping method is selected on the cart
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      throw new Error("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน")
    }
    // Shipping methods are already persisted on the cart by the delivery step,
    // no need to re-sync from localStorage.
  }

  const getSessionForProvider = (providerId?: string) => {
    if (!providerId) return undefined
    const localSession = localSessions[providerId]
    if (isCheckoutSelectableStripeSession(localSession)) {
      return localSession
    }

    return cart.payment_collection
      ? findStripeSessionForSlice(
          cart.payment_collection,
          providerId.toLowerCase().includes("promptpay") ? "promptpay" : "card",
          providerId
        )
      : undefined
  }

  const firstSliceCollection = mpCheckout?.slices[0]
    ? sliceCollectionsById[mpCheckout.slices[0].payment_collection_id]
    : undefined

  const marketplaceCardSession =
    mpCheckout && stripeProviderId
      ? findStripeSessionForSlice(
          firstSliceCollection,
          "card",
          stripeProviderId
        )
      : undefined
  const marketplacePromptpaySession =
    mpCheckout && promptpayProviderId
      ? findStripeSessionForSlice(
          firstSliceCollection,
          "promptpay",
          promptpayProviderId
        )
      : undefined

  const fallbackStripeSession = cart.payment_collection
    ? findStripeSessionForSlice(cart.payment_collection, "card")
    : undefined
  const fallbackPromptpaySession = cart.payment_collection
    ? findStripeSessionForSlice(cart.payment_collection, "promptpay")
    : undefined

  const stripeSession =
    marketplaceCardSession ||
    getSessionForProvider(stripeProviderId) ||
    fallbackStripeSession
  const promptpaySession =
    marketplacePromptpaySession ||
    getSessionForProvider(promptpayProviderId) ||
    fallbackPromptpaySession

  const activeSession = method === "qrcode" ? promptpaySession : stripeSession
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  const ensurePaymentSession = async (
    providerId: string | undefined,
    methodType: "card" | "promptpay"
  ) => {
    if (!providerId) {
      const fallback = methodType === "card" ? stripeSession : promptpaySession
      if (fallback) {
        return fallback
      }
      throw new Error("ไม่พบผู้ให้บริการชำระเงิน")
    }

    const { mp, byId } = await runMarketplaceInitIfNeeded(methodType)
    const first = mp.slices[0]
    if (!first) {
      throw new Error("ไม่พบรายการชำระเงิน")
    }
    const session = findStripeSessionForSlice(
      byId[first.payment_collection_id],
      methodType,
      providerId
    )
    if (!session) {
      throw new Error("ไม่สามารถสร้างการชำระเงินได้")
    }
    setLocalSessions((prev) => ({ ...prev, [providerId]: session }))
    return session
  }

  const ensureCardClientSecret = async () => {
    const session = await ensurePaymentSession(stripeProviderId, "card")
    const secret = session?.data?.client_secret as string | undefined
    if (!secret) {
      throw new Error("ยังไม่สามารถสร้างการชำระเงินได้")
    }
    return secret
  }

  const ensurePromptpayClientSecret = async (): Promise<{
    clientSecret: string
    createdAt?: string | null
  }> => {
    const session = await ensurePaymentSession(promptpayProviderId, "promptpay")
    const secret = session?.data?.client_secret as string | undefined
    if (!secret) {
      throw new Error("ยังไม่สามารถสร้างการชำระเงินได้")
    }
    return {
      clientSecret: secret,
      createdAt: (session as { created_at?: string | null } | undefined)
        ?.created_at,
    }
  }

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

  const getMarketplaceSnapshot = () => ({
    mp: mpRef.current,
    byId: sliceMapRef.current as Record<
      string,
      HttpTypes.StorePaymentCollection
    >,
  })

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
        null) || null,
    customerEmail:
      ((cart as { customer?: { email?: string | null } }).customer?.email ??
        customer?.email ??
        null) || null,
    promotionCodes:
      (cart.promotions ?? [])
        .map((promotion) => promotion.code)
        .filter((code): code is string => typeof code === "string" && code.length > 0) ?? [],
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

  /** Runs before payment: validate, then sync the active address into cart. Returns error message or null. */
  const runBeforePaymentSteps = async (): Promise<string | null> => {
    // 1. Address validation
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

    // 2. Shipping option validation (check cart data, not localStorage)
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      return "กรุณาเลือกวิธีจัดส่ง"
    }

    // 3. Payment method validation for card
    if (method === "card") {
      const hasCard =
        selectedPaymentMethodId || (useNewCard && getCardComplete())
      if (!hasCard) {
        return "กรุณาเลือกบัตรหรือกรอกรายละเอียดบัตร"
      }
    }

    // 4. Persist / sync address
    if (shippingAddressIsDraft && draftAddress) {
      // Draft address flow: create customer address, then sync into cart
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
      // Saved address flow: sync currently selected/snapshot address into cart only
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

        {method === "card" ? (
          stripeReady ? (
            <>
              <StripeSummaryPayButton
                cardholderName={cardholderName}
                billingAddress={fallbackAddress}
                email={fallbackEmail}
                syncShippingMethodBeforePayment={
                  syncShippingMethodBeforePayment
                }
                disabled={
                  disabledBase || !cardComplete || marketplaceInitializing
                }
                ensureClientSecret={ensureCardClientSecret}
                submitting={submitting}
                setSubmitting={setSubmitting}
                setError={setError}
                onBeforePayment={runBeforePaymentSteps}
                useNewCard={useNewCard}
                selectedPaymentMethodId={selectedPaymentMethodId}
                toastError={toast.error}
                getMarketplaceSnapshot={getMarketplaceSnapshot}
                stripeProviderId={stripeProviderId}
                cartSnapshot={cartSnapshot}
              />
            </>
          ) : (
            <Button size="lg" variant="primary" fill disabled>
              Loading Stripe...
            </Button>
          )
        ) : method === "qrcode" ? (
          stripeReady ? (
            <QrSummaryPayButton
              cartId={cart.id}
              locale={checkoutLocale}
              clientSecret={clientSecret}
              initialSessionCreatedAt={
                typeof (promptpaySession as { created_at?: unknown } | undefined)
                  ?.created_at === "string"
                  ? (promptpaySession as { created_at?: string }).created_at
                  : null
              }
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
              setSubmitting={setSubmitting}
              setError={setError}
              syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
              ensureClientSecret={ensurePromptpayClientSecret}
              onBeforePayment={runBeforePaymentSteps}
              toastError={toast.error}
              cartSnapshot={cartSnapshot}
            />
          ) : (
            <Button size="lg" variant="primary" fill disabled>
              Loading Stripe...
            </Button>
          )
        ) : (
          <ManualSummaryPayButton
            disabled={disabledBase || marketplaceInitializing}
            submitting={submitting}
            setSubmitting={setSubmitting}
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

const getPromptPayQrUrl = (
  paymentIntent?: PaymentIntent | null
): string | null => {
  const nextAction = paymentIntent?.next_action as any
  if (!nextAction || nextAction.type !== "promptpay_display_qr_code") {
    return null
  }

  return (
    nextAction.promptpay_display_qr_code?.image_url_png ||
    nextAction.promptpay_display_qr_code?.image_url_svg ||
    null
  )
}

const getPromptPayRedirectUrl = (
  paymentIntent?: PaymentIntent | null
): string | null => {
  const nextAction = paymentIntent?.next_action as
    | { type?: string; redirect_to_url?: { url?: string } }
    | undefined
  if (
    nextAction?.type === "redirect_to_url" &&
    typeof nextAction.redirect_to_url?.url === "string"
  ) {
    return nextAction.redirect_to_url.url
  }
  return null
}

const resolveBillingEmail = (email?: string) => {
  const normalized = email?.trim()
  if (normalized) {
    return normalized
  }

  // PromptPay requires billing_details.email; use a safe fallback for guest checkout.
  return `guest-${Date.now()}@sopet.app`
}

const StripeSummaryPayButton = ({
  cardholderName,
  billingAddress,
  email,
  syncShippingMethodBeforePayment,
  ensureClientSecret,
  disabled,
  submitting,
  setSubmitting,
  setError,
  onBeforePayment,
  useNewCard,
  selectedPaymentMethodId,
  toastError,
  cartSnapshot,
  getMarketplaceSnapshot,
  stripeProviderId,
}: {
  cardholderName: string
  billingAddress?:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  email?: string
  syncShippingMethodBeforePayment: () => Promise<void>
  ensureClientSecret: () => Promise<string>
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
  onBeforePayment?: () => Promise<string | null>
  useNewCard?: boolean
  selectedPaymentMethodId?: string | null
  toastError?: (opts: { title: string; description?: string }) => void
  cartSnapshot?: {
    customerId?: string | null
    email?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    promotionCodes?: string[] | null
  }
  getMarketplaceSnapshot: () => {
    mp: MpCheckoutV1 | null
    byId: Record<string, HttpTypes.StorePaymentCollection>
  }
  stripeProviderId?: string
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const completeOrderAndRedirect = async () => {
    const res = await completeMarketplaceOrder(undefined, {
      redirect: false,
      cartSnapshot,
    })
    const orderId = getOrderIdFromPlaceOrderResponse(res)

    if (orderId) {
      router.push(`/order/${orderId}/confirmed`)
      return
    }

    if (!res?.ok) {
      throw new Error(res?.error?.message || "Payment failed")
    }
  }

  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          return
        }
      }

      await syncShippingMethodBeforePayment()

      if (!stripe || !elements) {
        throw new Error("ระบบชำระเงินยังไม่พร้อมใช้งาน")
      }

      await ensureClientSecret()

      const { mp, byId } = getMarketplaceSnapshot()
      if (!mp?.slices?.length) {
        throw new Error("ไม่พบข้อมูลการชำระเงิน กรุณารีเฟรชหน้า")
      }

      if (allMarketplaceSlicesAuthorized(mp, byId)) {
        await completeOrderAndRedirect()
        return
      }

      const secrets = getMarketplaceClientSecretsInOrder(
        mp,
        byId,
        "card",
        stripeProviderId
      )
      if (secrets.length !== mp.slices.length) {
        throw new Error("ไม่ครบจำนวนการชำระเงินต่อร้าน กรุณารีเฟรชหน้า")
      }

      const billingNameFromCart = [
        billingAddress?.first_name,
        billingAddress?.last_name,
      ]
        .filter(Boolean)
        .join(" ")
      const billingName =
        cardholderName?.trim() || billingNameFromCart || undefined
      const billingEmail = resolveBillingEmail(email)
      const billingDetails = {
        name: billingName,
        address: {
          city: billingAddress?.city ?? undefined,
          country: billingAddress?.country_code ?? undefined,
          line1: billingAddress?.address_1 ?? undefined,
          line2: billingAddress?.address_2 ?? undefined,
          postal_code: billingAddress?.postal_code ?? undefined,
          state: billingAddress?.province ?? undefined,
        },
        email: billingEmail,
        phone: billingAddress?.phone ?? undefined,
      }

      let paymentMethodIdToUse: string | null = useNewCard
        ? null
        : (selectedPaymentMethodId ?? null)

      if (useNewCard) {
        const cardElement =
          elements.getElement(CardNumberElement) ||
          elements.getElement(CardElement)
        if (!cardElement) {
          throw new Error("กรุณากรอกรายละเอียดบัตรให้ครบถ้วน")
        }
        const { paymentMethod, error: createError } =
          await stripe.createPaymentMethod({
            type: "card",
            card: cardElement,
            billing_details: billingDetails,
          })
        if (createError) {
          throw new Error(
            createError.message ?? "ไม่สามารถสร้างวิธีการชำระเงินได้"
          )
        }
        if (!paymentMethod?.id) {
          throw new Error("ไม่สามารถสร้างวิธีการชำระเงินได้")
        }
        const addResult = await addCustomerPaymentMethod({
          paymentMethodId: paymentMethod.id,
          makeDefault: false,
        })
        if (!addResult.success) {
          if (
            addResult.code === "missing_stripe_customer" ||
            addResult.code === "stripe_customer_not_found"
          ) {
            toast.error({
              title: "ไม่สามารถเพิ่มบัตรได้",
              description: "กรุณารีเฟรชหรือเข้าสู่ระบบใหม่",
            })
          }
          throw new Error(addResult.error ?? "ไม่สามารถบันทึกบัตรได้")
        }
        paymentMethodIdToUse = paymentMethod.id
      }

      const assertSlicePaid = (
        stripeError:
          | { message?: string; payment_intent?: PaymentIntent | null }
          | null
          | undefined,
        paymentIntent: PaymentIntent | null | undefined
      ) => {
        if (stripeError) {
          const pi = stripeError.payment_intent
          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            return
          }
          throw new Error(stripeError.message || "Payment failed")
        }
        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent?.status === "succeeded"
        ) {
          return
        }
        throw new Error("Payment failed")
      }

      if (paymentMethodIdToUse) {
        for (const secret of secrets) {
          const { error: stripeError, paymentIntent } =
            await stripe.confirmCardPayment(secret, {
              payment_method: paymentMethodIdToUse,
            })
          assertSlicePaid(stripeError, paymentIntent)
        }
        await completeOrderAndRedirect()
        return
      }

      const cardElement =
        elements.getElement(CardNumberElement) ||
        elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("กรุณากรอกรายละเอียดบัตรให้ครบถ้วน")
      }

      for (const secret of secrets) {
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(secret, {
            payment_method: {
              card: cardElement,
              billing_details: billingDetails,
            },
          })
        assertSlicePaid(stripeError, paymentIntent)
      }
      await completeOrderAndRedirect()
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
    } finally {
      setSubmitting(false)
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
  setSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  onBeforePayment,
  toastError,
  cartSnapshot,
}: {
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
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
}) => {
  const router = useRouter()

  const handlePayment = async () => {
    setSubmitting(true)
    setError(null)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          return
        }
      }
      await syncShippingMethodBeforePayment()
      const res = await completeMarketplaceOrder(undefined, {
        redirect: false,
        cartSnapshot,
      })
      const orderId = getOrderIdFromPlaceOrderResponse(res)
      if (orderId) {
        router.push(`/order/${orderId}/confirmed`)
        return
      }
      if (!res?.ok) {
        throw new Error(res?.error?.message || "Payment failed")
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "Payment failed")
    } finally {
      setSubmitting(false)
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
  clientSecret,
  initialSessionCreatedAt,
  billingAddress,
  email,
  totalAmount,
  currencyCode,
  disabled,
  submitting,
  setSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  ensureClientSecret,
  onBeforePayment,
  toastError,
  cartSnapshot,
}: {
  cartId: string
  locale: string
  clientSecret?: string
  initialSessionCreatedAt?: string | null
  billingAddress?:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  email?: string
  totalAmount: number
  currencyCode: string
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
  syncShippingMethodBeforePayment: () => Promise<void>
  ensureClientSecret: () => Promise<{
    clientSecret: string
    createdAt?: string | null
  }>
  onBeforePayment?: () => Promise<string | null>
  toastError?: (opts: { title: string; description?: string }) => void
  cartSnapshot?: {
    customerId?: string | null
    email?: string | null
    customerPhone?: string | null
    customerEmail?: string | null
    promotionCodes?: string[] | null
  }
}) => {
  const stripe = useStripe()
  const router = useRouter()
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [qrExpiresAtMs, setQrExpiresAtMs] = useState<number | null>(null)
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false)
  const orderPlacedRef = useRef(false)
  const sessionCreatedAtRef = useRef<string | null | undefined>(
    initialSessionCreatedAt
  )
  const [activeClientSecret, setActiveClientSecret] = useState<
    string | undefined
  >(clientSecret)
  const [awaitingBankConfirm, setAwaitingBankConfirm] = useState(false)

  const { remainingSeconds, isExpired: isTimerExpired } = usePaymentCountdown(
    qrImageUrl && qrExpiresAtMs != null ? qrExpiresAtMs : null
  )
  const hms =
    remainingSeconds != null ? formatCountdownHms(remainingSeconds) : null

  /** Closing the QR modal only hides the UI — it does not cancel the PaymentIntent or clear the cart. */
  const handleCloseQrModal = () => {
    setIsQrModalOpen(false)
  }

  useEffect(() => {
    if (clientSecret) {
      setActiveClientSecret(clientSecret)
    }
  }, [clientSecret])

  useEffect(() => {
    sessionCreatedAtRef.current = initialSessionCreatedAt
  }, [initialSessionCreatedAt])

  const completePlaceOrderCaptureAndNavigate = useCallback(async () => {
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

    /** PromptPay often settles asynchronously; Medusa capture can fail until Stripe syncs. */
    const backoffMs = [0, 900, 2000, 3500]
    let lastErr: string | null = null
    for (let i = 0; i < backoffMs.length; i++) {
      if (backoffMs[i] > 0) {
        await new Promise((r) => setTimeout(r, backoffMs[i]))
      }
      const captureResult = await captureOrderPayment(orderId)
      if (captureResult.success) {
        setAwaitingBankConfirm(false)
        router.refresh()
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

  const confirmPromptPayForSecret = async (resolvedSecret: string) => {
    if (!stripe) {
      throw new Error("ระบบชำระเงินยังไม่พร้อมใช้งาน")
    }
    const billingEmail = resolveBillingEmail(email)
    return stripe.confirmPromptPayPayment(
      resolvedSecret,
      {
        payment_method: {
          billing_details: {
            name: [billingAddress?.first_name, billingAddress?.last_name]
              .filter(Boolean)
              .join(" "),
            email: billingEmail,
            phone: billingAddress?.phone || undefined,
            address: {
              city: billingAddress?.city ?? undefined,
              country: billingAddress?.country_code ?? undefined,
              line1: billingAddress?.address_1 ?? undefined,
              line2: billingAddress?.address_2 ?? undefined,
              postal_code: billingAddress?.postal_code ?? undefined,
              state: billingAddress?.province ?? undefined,
            },
          },
        },
      },
      { handleActions: false }
    )
  }

  const resolveSecretAndMeta = async () => {
    if (activeClientSecret) {
      return {
        clientSecret: activeClientSecret,
        createdAt: sessionCreatedAtRef.current,
      }
    }
    const ensured = await ensureClientSecret()
    setActiveClientSecret(ensured.clientSecret)
    sessionCreatedAtRef.current = ensured.createdAt
    return ensured
  }

  const applyQrSuccess = (
    qrUrl: string,
    createdAt?: string | null | undefined
  ) => {
    orderPlacedRef.current = false
    setAwaitingBankConfirm(false)
    setQrImageUrl(qrUrl)
    setQrExpiresAtMs(getPromptPayCheckoutClickDeadlineMs())
    setIsQrModalOpen(true)
    setIsPolling(true)
    setError(null)
  }

  const handleGenerateQr = async () => {
    setSubmitting(true)
    setError(null)
    setAwaitingBankConfirm(false)

    try {
      if (onBeforePayment) {
        const validationError = await onBeforePayment()
        if (validationError) {
          toastError?.({ title: validationError })
          return
        }
      }
      await syncShippingMethodBeforePayment()

      const { clientSecret: resolvedSecret, createdAt } =
        await resolveSecretAndMeta()

      const { error: stripeError, paymentIntent } =
        await confirmPromptPayForSecret(resolvedSecret)

      if (stripeError) {
        throw new Error(stripeError.message || "QR payment failed")
      }

      const qrUrl = getPromptPayQrUrl(paymentIntent)
      const bankRedirectUrl = getPromptPayRedirectUrl(paymentIntent)
      const status = paymentIntent?.status

      if (bankRedirectUrl) {
        try {
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
            clientSecret: resolvedSecret,
            locale,
            qrImageUrl: null,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            sessionCreatedAt: createdAt ?? null,
            mode: "redirect",
            redirectUrl: bankRedirectUrl,
          })
          writeOrderPromptPayContinuity(orderIdEarly, {
            clientSecret: resolvedSecret,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            qrImageUrl: null,
            sessionCreatedAt: createdAt ?? null,
          })
          router.push(`/${locale}/checkout/promptpay`)
          return
        } catch (placeErr) {
          toastError?.({
            title: "ไม่สามารถบันทึกคำสั่งซื้อล่วงหน้าได้",
            description: (placeErr as Error)?.message,
          })
          window.open(bankRedirectUrl, "_blank", "noopener,noreferrer")
          return
        }
      }

      if (qrUrl) {
        try {
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
            clientSecret: resolvedSecret,
            locale,
            qrImageUrl: qrUrl,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            sessionCreatedAt: createdAt ?? null,
            mode: "qr",
          })
          writeOrderPromptPayContinuity(orderIdEarly, {
            clientSecret: resolvedSecret,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            qrImageUrl: qrUrl,
            sessionCreatedAt: createdAt ?? null,
          })
          router.push(`/${locale}/checkout/promptpay`)
          return
        } catch (placeErr) {
          toastError?.({
            title: "ไม่สามารถบันทึกคำสั่งซื้อล่วงหน้าได้",
            description: (placeErr as Error)?.message,
          })
          applyQrSuccess(qrUrl, createdAt)
        }
      } else if (status === "succeeded" || status === "requires_capture") {
        orderPlacedRef.current = true
        setIsPolling(false)
        setAwaitingBankConfirm(false)
        await completePlaceOrderCaptureAndNavigate()
      } else if (status === "processing") {
        try {
          const orderRes = await completeMarketplaceOrder(cartId, {
            redirect: false,
            cartSnapshot,
          })
          const orderIdEarly = getOrderIdFromPlaceOrderResponse(orderRes)
          if (orderRes.ok && orderIdEarly) {
            writePromptPayCheckoutLock({
              cartId,
              orderId: orderIdEarly,
              clientSecret: resolvedSecret,
              locale,
              qrImageUrl: null,
              qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
              sessionCreatedAt: createdAt ?? null,
              mode: "processing",
            })
            writeOrderPromptPayContinuity(orderIdEarly, {
              clientSecret: resolvedSecret,
              qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
              qrImageUrl: null,
              sessionCreatedAt: createdAt ?? null,
            })
            router.push(`/${locale}/checkout/promptpay`)
            return
          }
        } catch {
          // stay on checkout
        }
        orderPlacedRef.current = false
        setAwaitingBankConfirm(true)
        setIsPolling(true)
      } else {
        throw new Error("ไม่พบ QR Code สำหรับการชำระเงิน")
      }
    } catch (e: unknown) {
      setAwaitingBankConfirm(false)
      setError((e as Error)?.message || "QR payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegenerateQr = async () => {
    setIsRegeneratingQr(true)
    setError(null)
    setAwaitingBankConfirm(false)
    orderPlacedRef.current = false
    try {
      await syncShippingMethodBeforePayment()
      const ensured = await ensureClientSecret()
      setActiveClientSecret(ensured.clientSecret)
      sessionCreatedAtRef.current = ensured.createdAt

      const { error: stripeError, paymentIntent } =
        await confirmPromptPayForSecret(ensured.clientSecret)

      if (stripeError) {
        throw new Error(stripeError.message || "QR payment failed")
      }

      const qrUrl = getPromptPayQrUrl(paymentIntent)
      const bankRedirectUrl = getPromptPayRedirectUrl(paymentIntent)
      const st = paymentIntent?.status

      if (bankRedirectUrl) {
        try {
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
            clientSecret: ensured.clientSecret,
            locale,
            qrImageUrl: null,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            sessionCreatedAt: ensured.createdAt ?? null,
            mode: "redirect",
            redirectUrl: bankRedirectUrl,
          })
          writeOrderPromptPayContinuity(orderIdEarly, {
            clientSecret: ensured.clientSecret,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            qrImageUrl: null,
            sessionCreatedAt: ensured.createdAt ?? null,
          })
          router.push(`/${locale}/checkout/promptpay`)
          return
        } catch (placeErr) {
          toastError?.({
            title: "ไม่สามารถบันทึกคำสั่งซื้อล่วงหน้าได้",
            description: (placeErr as Error)?.message,
          })
          window.open(bankRedirectUrl, "_blank", "noopener,noreferrer")
          return
        }
      }

      if (qrUrl) {
        try {
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
            clientSecret: ensured.clientSecret,
            locale,
            qrImageUrl: qrUrl,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            sessionCreatedAt: ensured.createdAt ?? null,
            mode: "qr",
          })
          writeOrderPromptPayContinuity(orderIdEarly, {
            clientSecret: ensured.clientSecret,
            qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
            qrImageUrl: qrUrl,
            sessionCreatedAt: ensured.createdAt ?? null,
          })
          router.push(`/${locale}/checkout/promptpay`)
          return
        } catch (placeErr) {
          toastError?.({
            title: "ไม่สามารถบันทึกคำสั่งซื้อล่วงหน้าได้",
            description: (placeErr as Error)?.message,
          })
          applyQrSuccess(qrUrl, ensured.createdAt)
        }
      } else if (st === "succeeded" || st === "requires_capture") {
        orderPlacedRef.current = true
        setIsPolling(false)
        setAwaitingBankConfirm(false)
        await completePlaceOrderCaptureAndNavigate()
      } else if (st === "processing") {
        try {
          const orderRes = await completeMarketplaceOrder(cartId, {
            redirect: false,
            cartSnapshot,
          })
          const orderIdEarly = getOrderIdFromPlaceOrderResponse(orderRes)
          if (orderRes.ok && orderIdEarly) {
            writePromptPayCheckoutLock({
              cartId,
              orderId: orderIdEarly,
              clientSecret: ensured.clientSecret,
              locale,
              qrImageUrl: null,
              qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
              sessionCreatedAt: ensured.createdAt ?? null,
              mode: "processing",
            })
            writeOrderPromptPayContinuity(orderIdEarly, {
              clientSecret: ensured.clientSecret,
              qrExpiresAtMs: getPromptPayCheckoutClickDeadlineMs(),
              qrImageUrl: null,
              sessionCreatedAt: ensured.createdAt ?? null,
            })
            router.push(`/${locale}/checkout/promptpay`)
            return
          }
        } catch {
          // stay on checkout
        }
        orderPlacedRef.current = false
        setAwaitingBankConfirm(true)
        setIsPolling(true)
      } else {
        throw new Error("ไม่พบ QR Code สำหรับการชำระเงิน")
      }
    } catch (e: unknown) {
      setAwaitingBankConfirm(false)
      setError((e as Error)?.message || "QR payment failed")
    } finally {
      setIsRegeneratingQr(false)
    }
  }

  useEffect(() => {
    if (!isPolling || !activeClientSecret || !stripe) return

    const timer = window.setInterval(async () => {
      if (orderPlacedRef.current) {
        window.clearInterval(timer)
        return
      }

      try {
        const piResult = await stripe.retrievePaymentIntent(activeClientSecret)
        const status = piResult.paymentIntent?.status

        if (status === "canceled") {
          window.clearInterval(timer)
          setIsPolling(false)
          setAwaitingBankConfirm(false)
          setError("การชำระเงินหมดเวลา กรุณาสร้าง QR ใหม่")
          return
        }

        if (status === "succeeded" || status === "requires_capture") {
          orderPlacedRef.current = true
          window.clearInterval(timer)
          setIsPolling(false)
          setAwaitingBankConfirm(false)
          try {
            await completePlaceOrderCaptureAndNavigate()
          } catch (e: unknown) {
            setError((e as Error)?.message ?? "ไม่สามารถยืนยันคำสั่งซื้อได้")
          }
        }
      } catch {
        // keep polling
      }
    }, 2500)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeClientSecret, completePlaceOrderCaptureAndNavigate, isPolling, setError, stripe])

  useEffect(() => {
    if (!qrImageUrl || qrExpiresAtMs == null) return
    if (!isTimerExpired || !isPolling) return

    setIsPolling(false)
    setAwaitingBankConfirm(false)
    setError("QR หมดเวลา กรุณาสร้างใหม่อีกครั้ง")
  }, [isTimerExpired, isPolling, qrExpiresAtMs, qrImageUrl, setError])

  const showExpiredOverlay = Boolean(
    isTimerExpired && qrImageUrl && !isRegeneratingQr
  )

  return (
    <>
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
        {awaitingBankConfirm && !qrImageUrl && (
          <Text className="text-sm text-gray-600 text-center">
            กำลังรอธนาคารยืนยันการชำระเงิน… หน้าจะไปต่ออัตโนมัติเมื่อสำเร็จ
          </Text>
        )}
      </div>

      {isQrModalOpen && qrImageUrl && (
        <Modal
          header={
            <div className="flex items-center justify-between">
              <span>PromptPay QR</span>
              <button
                type="button"
                onClick={handleCloseQrModal}
                className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded"
                aria-label="ปิด"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          }
          onClose={handleCloseQrModal}
          closeOnBackdropClick={false}
        >
          <div className="px-6 pb-6 space-y-4">
            <div className="rounded-lg bg-sop-primary-50 py-3 px-3 flex flex-wrap items-center justify-between gap-2">
              <Text className="font-medium">ชำระภายใน</Text>
              <div className="flex items-center gap-2">
                <Text className="font-bold text-red-500 tabular-nums">
                  {hms
                    ? isTimerExpired
                      ? "หมดเวลา"
                      : `${hms.h}:${hms.m}:${hms.s}`
                    : "—"}
                </Text>
                {isTimerExpired && !isRegeneratingQr && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleRegenerateQr()}
                  >
                    สร้าง QR ใหม่
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Text className="font-medium">ยอดชำระรวม</Text>
              <Text className="font-bold">
                {convertToLocale({
                  amount: totalAmount,
                  currency_code: currencyCode,
                })}
              </Text>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 relative min-h-64 flex items-center justify-center">
              {isRegeneratingQr ? (
                <Text className="text-gray-500">
                  กำลังสร้างคิวอาร์โค้ดใหม่...
                </Text>
              ) : (
                <>
                  <img
                    src={qrImageUrl}
                    alt="PromptPay QR"
                    className="mx-auto h-64 w-64 object-contain"
                  />
                  {showExpiredOverlay && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3 p-4 rounded-lg">
                      <Text className="font-medium text-red-600 text-center">
                        QR หมดเวลาแล้ว
                      </Text>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegenerateQr()}
                      >
                        สร้าง QR ใหม่
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            <a
              href={qrImageUrl}
              download="promptpay-qr.png"
              className={`block w-full rounded-full border border-red-400 px-4 py-2.5 text-center text-red-500 hover:bg-red-50 ${
                showExpiredOverlay || isRegeneratingQr
                  ? "pointer-events-none opacity-50"
                  : ""
              }`}
            >
              บันทึก QR Code
            </a>

            <Text className="text-center text-xs text-gray-500">
              เมื่อชำระสำเร็จ ระบบจะยืนยันคำสั่งซื้อให้อัตโนมัติ
            </Text>
            <Text className="text-center text-xs text-gray-400">
              การปิดหน้าต่างนี้ไม่ได้ยกเลิกการชำระเงิน หากต้องการดู QR
              อีกครั้งให้กดปุ่มชำระเงิน
            </Text>
          </div>
        </Modal>
      )}
    </>
  )
}

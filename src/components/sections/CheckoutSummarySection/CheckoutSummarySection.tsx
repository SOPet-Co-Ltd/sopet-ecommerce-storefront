"use client"

import { Button } from "@/components/atoms"
import { Cart } from "@/types/cart"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@/lib/helpers/money"
import { Text } from "@medusajs/ui"
import {
  clearCart,
  initiatePaymentSession,
  placeOrder,
  setAddresses,
  setShippingMethod,
} from "@/lib/data/cart"
import { getOrderIdFromPlaceOrderResponse } from "@/lib/helpers/place-order-response"
import { captureOrderPayment } from "@/lib/data/orders"
import {
  addCustomerAddress,
  addCustomerPaymentMethod,
} from "@/lib/data/customer"
import { toast } from "@/lib/helpers/toast"
import { useContext, useEffect, useRef, useState } from "react"
import {
  CardElement,
  CardNumberElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { StripeContext } from "@/components/organisms/PaymentContainer/StripeWrapper"
import { isStripe } from "@/lib/constants"
import { useCheckoutPayment } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import type { PaymentIntent } from "@stripe/stripe-js"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useParams, useRouter } from "next/navigation"

type CheckoutSummarySectionProps = {
  cart: Cart | null
  customer?: HttpTypes.StoreCustomer | null
  shippingMethods?: { id: string; amount?: number; seller_id?: string }[] | null
  paymentMethods?: HttpTypes.StorePaymentProvider[] | null
}

export const CheckoutSummarySection = ({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
}: CheckoutSummarySectionProps) => {
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
  const pendingShippingOptionKey = `checkout:selected_shipping_option:${cart.id}`

  const syncShippingMethodBeforePayment = async () => {
    // Validate that at least one shipping method is selected on the cart
    if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
      throw new Error("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน")
    }
    // Shipping methods are already persisted on the cart by the delivery step,
    // no need to re-sync from localStorage.
  }

  const isStripeProvider = (providerId?: string) =>
    providerId === "stripe" || isStripe(providerId)
  const isPromptpayProvider = (providerId?: string) =>
    providerId?.toLowerCase().includes("promptpay")

  // Find unified Stripe Connect provider (handles both card and promptpay)
  const unifiedStripeProviderId = paymentMethods?.find((provider) =>
    isStripeProvider(provider.id)
  )?.id

  // For backward compatibility, try to find separate providers first
  const stripeProviderId =
    paymentMethods?.find(
      (provider) =>
        isStripeProvider(provider.id) && !isPromptpayProvider(provider.id)
    )?.id || unifiedStripeProviderId
  const promptpayProviderId =
    paymentMethods?.find((provider) => isPromptpayProvider(provider.id))?.id ||
    unifiedStripeProviderId

  const getSessionForProvider = (providerId?: string) => {
    if (!providerId) return undefined
    return (
      localSessions[providerId] ||
      cart.payment_collection?.payment_sessions?.find(
        (session) => session.provider_id === providerId
      )
    )
  }

  const fallbackStripeSession = cart.payment_collection?.payment_sessions?.find(
    (session) => {
      // Check if it's a Stripe provider (unified or separate)
      if (!isStripeProvider(session.provider_id)) return false
      const data = session.data as any
      // Check if payment method type is card
      return data?.payment_method_types?.includes?.("card")
    }
  )
  const fallbackPromptpaySession =
    cart.payment_collection?.payment_sessions?.find((session) => {
      // Check if it's a Stripe provider (unified or separate)
      // Unified provider will match isStripeProvider, separate promptpay provider will match isPromptpayProvider
      if (
        !isStripeProvider(session.provider_id) &&
        !isPromptpayProvider(session.provider_id)
      )
        return false
      const data = session.data as any
      // Check if payment method type is promptpay
      return data?.payment_method_types?.includes?.("promptpay")
    })

  const stripeSession =
    getSessionForProvider(stripeProviderId) || fallbackStripeSession
  const promptpaySession =
    getSessionForProvider(promptpayProviderId) || fallbackPromptpaySession

  const activeSession = method === "qrcode" ? promptpaySession : stripeSession
  const clientSecret = activeSession?.data?.client_secret as string | undefined

  const extractPaymentSession = (
    payload: any,
    providerId?: string
  ): any | undefined => {
    if (!payload) return undefined
    if (payload.payment_session) return payload.payment_session

    const fromCollection = payload.payment_collection?.payment_sessions
    if (Array.isArray(fromCollection)) {
      return (
        (providerId
          ? fromCollection.find(
              (session: any) => session.provider_id === providerId
            )
          : fromCollection[0]) || undefined
      )
    }

    const fromSessions = payload.payment_sessions
    if (Array.isArray(fromSessions)) {
      return (
        (providerId
          ? fromSessions.find(
              (session: any) => session.provider_id === providerId
            )
          : fromSessions[0]) || undefined
      )
    }

    return undefined
  }

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

    const existing = getSessionForProvider(providerId)
    if (existing) {
      return existing
    }

    const response = await initiatePaymentSession(cart, {
      provider_id: providerId,
      data: { payment_method_types: [methodType] },
    })

    const createdSession = extractPaymentSession(response, providerId)
    if (!createdSession) {
      throw new Error("ไม่สามารถสร้างการชำระเงินได้")
    }

    setLocalSessions((prev) => ({ ...prev, [providerId]: createdSession }))
    return createdSession
  }

  const ensureCardClientSecret = async () => {
    const session = await ensurePaymentSession(stripeProviderId, "card")
    const secret = session?.data?.client_secret as string | undefined
    if (!secret) {
      throw new Error("ยังไม่สามารถสร้างการชำระเงินได้")
    }
    return secret
  }

  const ensurePromptpayClientSecret = async () => {
    const session = await ensurePaymentSession(promptpayProviderId, "promptpay")
    const secret = session?.data?.client_secret as string | undefined
    if (!secret) {
      throw new Error("ยังไม่สามารถสร้างการชำระเงินได้")
    }
    return secret
  }

  const fallbackAddress: HttpTypes.StoreCartAddress | null =
    (cart.billing_address ||
      cart.shipping_address ||
      selectedAddress ||
      null) as HttpTypes.StoreCartAddress | null
  const fallbackEmail = cart?.email || customer?.email || selectedEmail || ""

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

  const pendingShippingOptionKeyForValidate = `checkout:selected_shipping_option:${cart.id}`

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
                cart={cart}
                clientSecret={clientSecret}
                cardholderName={cardholderName}
                billingAddress={fallbackAddress}
                email={fallbackEmail}
                syncShippingMethodBeforePayment={
                  syncShippingMethodBeforePayment
                }
                disabled={disabledBase || !cardComplete}
                ensureClientSecret={ensureCardClientSecret}
                submitting={submitting}
                setSubmitting={setSubmitting}
                setError={setError}
                onBeforePayment={runBeforePaymentSteps}
                useNewCard={useNewCard}
                selectedPaymentMethodId={selectedPaymentMethodId}
                toastError={toast.error}
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
              clientSecret={clientSecret}
              billingAddress={fallbackAddress}
              email={fallbackEmail}
              totalAmount={total}
              currencyCode={currencyCode}
              disabled={disabledBase}
              submitting={submitting}
              setSubmitting={setSubmitting}
              setError={setError}
              syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
              ensureClientSecret={ensurePromptpayClientSecret}
              onBeforePayment={runBeforePaymentSteps}
              toastError={toast.error}
            />
          ) : (
            <Button size="lg" variant="primary" fill disabled>
              Loading Stripe...
            </Button>
          )
        ) : (
          <ManualSummaryPayButton
            disabled={disabledBase}
            submitting={submitting}
            setSubmitting={setSubmitting}
            setError={setError}
            syncShippingMethodBeforePayment={syncShippingMethodBeforePayment}
            onBeforePayment={runBeforePaymentSteps}
            toastError={toast.error}
          />
        )}
        {cardError && (
          <Text className="text-red-500 text-center text-sm">{cardError}</Text>
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

const resolveBillingEmail = (email?: string) => {
  const normalized = email?.trim()
  if (normalized) {
    return normalized
  }

  // PromptPay requires billing_details.email; use a safe fallback for guest checkout.
  return `guest-${Date.now()}@sopet.app`
}

const StripeSummaryPayButton = ({
  cart,
  clientSecret,
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
}: {
  cart: Cart
  clientSecret?: string
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
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const completeOrderAndRedirect = async () => {
    const res = await placeOrder(undefined, { redirect: false })
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

      if (cart.payment_collection?.status === "authorized") {
        await completeOrderAndRedirect()
        return
      }

      if (!stripe || !elements) {
        throw new Error("ระบบชำระเงินยังไม่พร้อมใช้งาน")
      }

      const activeClientSecret = clientSecret || (await ensureClientSecret())
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

      if (paymentMethodIdToUse) {
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(activeClientSecret, {
            payment_method: paymentMethodIdToUse,
          })
        if (stripeError) {
          const pi = stripeError.payment_intent
          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            await completeOrderAndRedirect()
            return
          }
          throw new Error(stripeError.message || "Payment failed")
        }
        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent?.status === "succeeded"
        ) {
          await completeOrderAndRedirect()
        }
        return
      }

      const cardElement =
        elements.getElement(CardNumberElement) ||
        elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error("กรุณากรอกรายละเอียดบัตรให้ครบถ้วน")
      }
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(activeClientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: billingDetails,
          },
        })
      if (stripeError) {
        const pi = stripeError.payment_intent
        if (
          (pi && pi.status === "requires_capture") ||
          (pi && pi.status === "succeeded")
        ) {
          await completeOrderAndRedirect()
          return
        }
        throw new Error(stripeError.message || "Payment failed")
      }
      if (
        (paymentIntent && paymentIntent.status === "requires_capture") ||
        paymentIntent?.status === "succeeded"
      ) {
        await completeOrderAndRedirect()
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

const ManualSummaryPayButton = ({
  disabled,
  submitting,
  setSubmitting,
  setError,
  syncShippingMethodBeforePayment,
  onBeforePayment,
  toastError,
}: {
  disabled: boolean
  submitting: boolean
  setSubmitting: (value: boolean) => void
  setError: (error: string | null) => void
  syncShippingMethodBeforePayment: () => Promise<void>
  onBeforePayment?: () => Promise<string | null>
  toastError?: (opts: { title: string; description?: string }) => void
}) => {
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
      await placeOrder()
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
  clientSecret,
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
}: {
  clientSecret?: string
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
  ensureClientSecret: () => Promise<string>
  onBeforePayment?: () => Promise<string | null>
  toastError?: (opts: { title: string; description?: string }) => void
}) => {
  const stripe = useStripe()
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const locale = typeof params?.locale === "string" ? params.locale : "th"
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(15 * 60)
  const orderPlacedRef = useRef(false)
  /** Set when we place the order before showing QR so we capture (not place again) when payment succeeds */
  const orderIdPendingPaymentRef = useRef<string | null>(null)
  const [activeClientSecret, setActiveClientSecret] = useState<
    string | undefined
  >(clientSecret)

  const handleCloseQrModal = () => {
    setIsQrModalOpen(false)
    clearCart().then(() => {
      router.push(`/${locale}/user/orders?tab=to-pay`)
    })
  }

  useEffect(() => {
    if (clientSecret) {
      setActiveClientSecret(clientSecret)
    }
  }, [clientSecret])

  const completeOrderAndRedirect = async () => {
    const res = await placeOrder(undefined, { redirect: false })
    const orderId = getOrderIdFromPlaceOrderResponse(res)

    if (orderId) {
      router.push(`/order/${orderId}/confirmed`)
      return
    }

    if (!res?.ok) {
      throw new Error(res?.error?.message || "Payment failed")
    }
  }

  const handleGenerateQr = async () => {
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

      if (!stripe) {
        throw new Error("ระบบชำระเงินยังไม่พร้อมใช้งาน")
      }

      const resolvedClientSecret =
        activeClientSecret || (await ensureClientSecret())
      if (!activeClientSecret) {
        setActiveClientSecret(resolvedClientSecret)
      }
      const billingEmail = resolveBillingEmail(email)

      const { error: stripeError, paymentIntent } =
        await stripe.confirmPromptPayPayment(
          resolvedClientSecret,
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

      if (stripeError) {
        throw new Error(stripeError.message || "QR payment failed")
      }

      const qrUrl = getPromptPayQrUrl(paymentIntent)
      if (qrUrl) {
        orderIdPendingPaymentRef.current = null
        try {
          const res = await placeOrder(undefined, { redirect: false })
          const orderId = getOrderIdFromPlaceOrderResponse(res)
          if (orderId) {
            orderIdPendingPaymentRef.current = orderId
            router.refresh()
            setQrImageUrl(qrUrl)
            setRemainingSeconds(15 * 60)
            setIsQrModalOpen(true)
            setIsPolling(true)
          } else {
            setError(
              res?.error?.message ??
                "ไม่สามารถสร้างคำสั่งซื้อได้ กรุณาลองใหม่อีกครั้ง"
            )
          }
        } catch (e) {
          setError((e as Error)?.message ?? "ไม่สามารถสร้างคำสั่งซื้อได้")
        }
      } else if (
        paymentIntent?.status === "succeeded" ||
        paymentIntent?.status === "requires_capture"
      ) {
        orderPlacedRef.current = true
        await completeOrderAndRedirect()
      } else {
        throw new Error("ไม่พบ QR Code สำหรับการชำระเงิน")
      }
    } catch (e: unknown) {
      setError((e as Error)?.message || "QR payment failed")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isPolling || !activeClientSecret || !stripe) return

    const timer = window.setInterval(async () => {
      if (orderPlacedRef.current) {
        window.clearInterval(timer)
        return
      }

      const result = await stripe.retrievePaymentIntent(activeClientSecret)
      const status = result.paymentIntent?.status

      if (status === "succeeded" || status === "requires_capture") {
        orderPlacedRef.current = true
        window.clearInterval(timer)
        setIsPolling(false)
        const orderId = orderIdPendingPaymentRef.current
        if (orderId) {
          const result = await captureOrderPayment(orderId)
          if (result.success) {
            router.push(`/order/${orderId}/confirmed`)
          } else {
            setError(result.error ?? "Failed to confirm payment")
          }
        } else {
          await completeOrderAndRedirect()
        }
      }
    }, 2500)

    return () => {
      window.clearInterval(timer)
    }
  }, [activeClientSecret, isPolling, stripe])

  useEffect(() => {
    if (!isQrModalOpen || !isPolling) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          setIsPolling(false)
          setError("QR หมดเวลา กรุณาสร้างใหม่อีกครั้ง")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isPolling, isQrModalOpen, setError])

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0")
  const seconds = String(remainingSeconds % 60).padStart(2, "0")

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
            <div className="rounded-lg bg-sop-primary-50 py-3 flex items-center justify-between">
              <Text className="font-medium">ชำระภายใน</Text>
              <Text className="font-bold text-red-500">
                {minutes}:{seconds}
              </Text>
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

            <div className="rounded-lg border border-gray-200 p-4">
              <img
                src={qrImageUrl}
                alt="PromptPay QR"
                className="mx-auto h-64 w-64 object-contain"
              />
            </div>

            <a
              href={qrImageUrl}
              download="promptpay-qr.png"
              className="block w-full rounded-full border border-red-400 px-4 py-2.5 text-center text-red-500 hover:bg-red-50"
            >
              บันทึก QR Code
            </a>

            <Text className="text-center text-xs text-gray-500">
              เมื่อชำระสำเร็จ ระบบจะยืนยันคำสั่งซื้อให้อัตโนมัติ
            </Text>
          </div>
        </Modal>
      )}
    </>
  )
}

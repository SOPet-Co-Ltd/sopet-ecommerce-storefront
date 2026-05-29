"use client"

import { Button } from "@/components/atoms"
import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import {
  bootstrapMarketplacePaymentSessions,
  clearCheckoutCartCookie,
  completeMarketplaceOrder,
  setAddresses,
  setMultiShippingMethods,
} from "@/lib/data/cart"
import {
  attachCheckoutSessionOrder,
  getCheckoutSession,
  setCheckoutSessionStatus,
  type CheckoutSessionDto,
} from "@/lib/data/checkout-session"
import { captureOrderPayment, retrieveOrder } from "@/lib/data/orders"
import { getOrderIdFromPlaceOrderResponse } from "@/lib/helpers/place-order-response"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"
import {
  formatCountdownHms,
  getPromptPayPendingTtlSeconds,
} from "@/lib/helpers/pending-payment-expiry"
import { toast } from "@/lib/helpers/toast"
import type { OrderDetails } from "@/types/order"
import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { SaveIcon } from "@/icons"

type ProviderSessionData = {
  qr_image_url?: string | null
  qr_code_url?: string | null
  redirect_url?: string | null
  authorize_uri?: string | null
  next_action?: { redirect_to_url?: { url?: string | null } | null } | null
  expires_at?: string | number | null
  last_payment_error?: {
    code?: string | null
    decline_code?: string | null
    message?: string | null
    type?: string | null
  } | null
  payment_method_types?: string[]
} & Record<string, unknown>

type PaymentSessionLike = {
  id?: string | null
  provider_id?: string | null
  status?: string | null
  created_at?: string | Date | null
  data?: ProviderSessionData | null
}

type PaymentCollectionLike = {
  id: string
  payment_sessions?: PaymentSessionLike[] | null
  payments?: Array<{ data?: ProviderSessionData | null }> | null
}

type PaymentPageClientProps = {
  locale: string
  session: CheckoutSessionDto
  order: OrderDetails | null
  providerId: string | null
}

type SavedAddress = {
  recipientFullName?: string | null
  contactPhone?: string | null
  phone?: string | null
  email?: string | null
  province?: string | null
  district?: string | null
  subDistrict?: string | null
  postalCode?: string | null
  address?: string | null
}

type SavedCartSnapshot = {
  id?: string | null
  currency_code?: string | null
  total?: number | null
  subtotal?: number | null
  shipping_total?: number | null
  discount_total?: number | null
  items?: Array<{ quantity?: number | null }> | null
}

type SavedCheckoutPayload = {
  cart?: SavedCartSnapshot | null
  customerSession?: {
    mode?: "logged_in" | "guest"
    customerId?: string | null
    email?: string | null
  }
  shippingAddress?: SavedAddress | null
  shippingMethods?: Array<{ optionId?: string | null }>
  promotions?: { site?: string[] | null; vendor?: string[] | null }
  coupons?: {
    site?: string | null
    vendor?: Record<string, string[]> | null
  }
  payment?: { method?: "card" | "promptpay" | string | null } | null
}

const CARD_CAPTURE_BACKOFFS_MS = [
  0, 1500, 3000, 5000, 8000, 12000, 18000, 25000,
]
const PROMPTPAY_POLL_INTERVAL_MS = 3000
const PROMPTPAY_GRACE_MS = 15000
const CARD_3DS_RETURN_PARAM = "return_from_3ds"

async function waitInterruptible(
  ms: number,
  shouldStop: () => boolean
): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (shouldStop()) return
    const remaining = ms - (Date.now() - start)
    await new Promise((r) => setTimeout(r, Math.min(200, remaining)))
  }
}

function getSavedPayload(session: CheckoutSessionDto): SavedCheckoutPayload {
  return session.payload as SavedCheckoutPayload
}

function toNumericAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === "object") {
    const numericValue = (value as { numeric_?: unknown }).numeric_
    if (typeof numericValue === "number" && Number.isFinite(numericValue)) {
      return numericValue
    }
  }

  return null
}

function formatPaymentAmount(
  amount: number | null,
  currencyCode: string | null | undefined
) {
  if (amount == null) {
    return "—"
  }

  try {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: currencyCode || "THB",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `฿${amount.toFixed(2)}`
  }
}

function getPaymentAmountLabel(
  session: CheckoutSessionDto,
  order: OrderDetails | null
): string {
  const payload = getSavedPayload(session)
  const cart = payload.cart
  const total = toNumericAmount(order?.total ?? cart?.total ?? null)
  const currencyCode = order?.currency_code ?? cart?.currency_code ?? "THB"
  return formatPaymentAmount(total, currencyCode)
}

function PaymentSpinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <Loader2
      className={`${className} animate-spin text-sop-primary-500`}
      aria-hidden
    />
  )
}

function StatusPill({
  errorMsg,
  statusText,
}: {
  errorMsg: string | null
  statusText: string
}) {
  return (
    <span className="sop-body-sm-regular min-w-0 truncate text-sop-secondary-600">
      {errorMsg ? "ต้องดำเนินการอีกครั้ง" : `${statusText} นาที`}
    </span>
  )
}

function ErrorPanel({
  errorMsg,
  onRetry,
}: {
  errorMsg: string
  onRetry: () => void
}) {
  return (
    <div className="mt-sop-20px rounded-sop-16px border border-sop-system-error-200 bg-sop-system-error-100 p-sop-16px">
      <div className="flex gap-sop-12px">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-sop-system-error-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="sop-body-sm-medium text-sop-system-error-500">
            ชำระเงินไม่สำเร็จ
          </p>
          <p className="sop-body-sm-regular mt-sop-4px text-sop-neutral-gray-300 break-words">
            {errorMsg}
          </p>
        </div>
      </div>
      <Button
        type="button"
        className="mt-sop-16px w-full"
        size="lg"
        iconLeft={<RefreshCw />}
        onClick={onRetry}
      >
        ลองชำระเงินอีกครั้ง
      </Button>
    </div>
  )
}

function PromptPayPaymentView({
  qrImageUrl,
  qrReference,
  hms,
  isBootstrapping,
  errorMsg,
  order,
  orderId,
  session,
}: {
  qrImageUrl: string | null
  qrReference: string | null
  hms: ReturnType<typeof formatCountdownHms> | null
  isBootstrapping: boolean
  errorMsg: string | null
  session: CheckoutSessionDto
  order: OrderDetails | null
  orderId: string | null
}) {
  const timerLabel = hms ? `${hms.h}:${hms.m}:${hms.s}` : "กำลังเตรียมเวลา"
  const amountLabel = getPaymentAmountLabel(session, order)

  async function handleSaveQRCode() {
    if (!qrImageUrl) return

    const filename = `promptpay-qr-${orderId ?? "sopet"}.png`
    const proxiedQrImageUrl = `/api/payment/qr-image?url=${encodeURIComponent(qrImageUrl)}`

    try {
      const response = await fetch(proxiedQrImageUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch QR code image")
      }
      const blob = await response.blob()
      const isSvg =
        blob.type.includes("svg") || qrImageUrl.toLowerCase().includes(".svg")

      let downloadBlob = blob
      if (isSvg) {
        const svgText = await blob.text()
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" })
        const svgUrl = window.URL.createObjectURL(svgBlob)

        try {
          const image = await new Promise<HTMLImageElement>(
            (resolve, reject) => {
              const img = new Image()
              img.onload = () => resolve(img)
              img.onerror = () => reject(new Error("Failed to render SVG"))
              img.src = svgUrl
            }
          )

          const canvas = document.createElement("canvas")
          canvas.width = image.naturalWidth || image.width || 512
          canvas.height = image.naturalHeight || image.height || 512

          const context = canvas.getContext("2d")
          if (!context) {
            throw new Error("Canvas context unavailable")
          }

          context.drawImage(image, 0, 0)

          downloadBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((pngBlob) => {
              if (!pngBlob) {
                reject(new Error("Failed to convert SVG to PNG"))
                return
              }
              resolve(pngBlob)
            }, "image/png")
          })
        } finally {
          window.URL.revokeObjectURL(svgUrl)
        }
      }

      const url = window.URL.createObjectURL(downloadBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error("Error downloading QR code:", error)
      try {
        const link = document.createElement("a")
        link.href = proxiedQrImageUrl
        link.download = filename
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.style.display = "none"
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError)
        window.open(qrImageUrl, "_blank", "noopener,noreferrer")
      }
    }
  }

  return (
    <section className="flex md:flex-row flex-col gap-5 w-full justify-center items-center">
      <section>
        <div className="flex flex-col w-[325px] items-center gap-4 border p-4 bg-sop-neutral-gray-600 border-sop-neutral-grayalpha-100 rounded-sop-16px shadow shadow-sop-neutral-grayalpha-100">
          <div className="flex flex-1 w-full justify-between items-center px-4 py-2 rounded-sop-8px bg-sop-secondary-100">
            <p className="sop-body-sm-regular text-sop-base-black">
              กรุณาชำระเงินภายใน
            </p>
            <StatusPill errorMsg={errorMsg} statusText={timerLabel} />
          </div>
          {qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrImageUrl}
              alt="PromptPay QR"
              className="h-68 w-61 object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-sop-12px text-sop-neutral-gray-400">
              <PaymentSpinner className="h-10 w-10" />
              <span className="sop-body-sm-regular">
                {isBootstrapping ? "กำลังสร้าง QR…" : "กำลังโหลด QR…"}
              </span>
            </div>
          )}
          <div className="flex justify-center items-center">
            <Button
              variant="outline"
              size="md"
              iconLeft={<SaveIcon size={13} color="#FF6F61" />}
              onClick={() => handleSaveQRCode()}
            >
              บันทึก QR Code
            </Button>
          </div>
        </div>
      </section>
      <div className="flex flex-col gap-3 w-full md:w-116 max-w-116.25">
        <div className="flex flex-col gap-1">
          <h2 className="sop-body-lg-medium text-sop-neutral-gray-200">
            สแกน QR เพื่อชำระเงิน
          </h2>
          <p className="sop-body-md-regular text-sop-neutral-gray-300">
            กรุณาอยู่ในหน้านี้จนกว่าการชำระเงินจะสำเร็จ
          </p>
        </div>
        <div className="flex flex-col gap-5 p-4 bg-sop-neutral-gray-500 rounded-sop-20px">
          <h2 className="sop-body-lg-medium text-sop-primary-500">
            รายละเอียดการชำระเงิน
          </h2>
          <div>
            <div className="flex items-center justify-between">
              <span className="sop-body-md-regular text-[#232323]">
                รหัสคำสั่งซื้อ
              </span>
              <span className="sop-body-sm-medium text-sop-base-black">
                {orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="sop-body-md-regular text-[#232323]">
                วันที่สั่งซื้อ
              </span>
              <span className="sop-body-sm-medium text-sop-base-black">
                {order?.created_at
                  ? new Date(order.created_at).toLocaleDateString("th-TH")
                  : "-"}
              </span>
            </div>
          </div>
          <div className="h-px w-full bg-sop-neutral-grayalpha-200"></div>
          <div className="flex justify-between items-center">
            <h2 className="lg:sop-body-lg-medium text-sop-neutral-gray-300">
              ยอดชำระเงิน
            </h2>
            <span className="lg:sop-headline-md-medium text-sop-secondary-600">
              {amountLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-5 p-4 bg-sop-neutral-gray-500 rounded-sop-20px">
          <h2 className="sop-body-md-medium text-sop-base-black">
            ข้อมูลบัญชีรับเงิน
          </h2>
          <div>
            <div className="flex items-center justify-between">
              <span>Reference ID</span>
              <span className="sop-body-sm-medium text-sop-base-black">
                {qrReference ?? "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CardPaymentView({
  statusText,
  errorMsg,
  cardAuthorizeUrl,
  onRetry,
}: {
  statusText: string
  errorMsg: string | null
  cardAuthorizeUrl: string | null
  onRetry: () => void
}) {
  return (
    <section className="rounded-sop-24px bg-sop-base-white p-sop-20px lg:p-sop-32px">
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center text-center">
        <div
          className={`flex h-sop-80px w-sop-80px items-center justify-center rounded-full ${
            errorMsg ? "bg-sop-system-error-100" : "bg-sop-primary-100"
          }`}
        >
          {errorMsg ? (
            <AlertCircle
              className="h-10 w-10 text-sop-system-error-500"
              aria-hidden
            />
          ) : (
            <CreditCard
              className="h-10 w-10 text-sop-primary-500"
              aria-hidden
            />
          )}
        </div>

        <h2 className="sop-headline-sm-medium mt-sop-20px text-sop-neutral-gray-100">
          {errorMsg ? "ชำระเงินไม่สำเร็จ" : "กำลังยืนยันการชำระเงิน"}
        </h2>
        <p className="sop-body-sm-regular mt-sop-8px max-w-[440px] text-sop-neutral-gray-400 lg:sop-body-md-regular">
          {errorMsg
            ? "ไม่สามารถยืนยันรายการนี้ได้ กรุณากลับไปเลือกวิธีชำระเงินอีกครั้ง"
            : "กรุณายืนยันรายการกับธนาคารผู้ออกบัตร และอย่าปิดหน้านี้จนกว่าระบบจะดำเนินการเสร็จ"}
        </p>

        {!errorMsg && (
          <div className="mt-sop-24px flex w-full flex-col items-center gap-sop-16px rounded-sop-20px bg-sop-neutral-gray-500 p-sop-20px">
            <PaymentSpinner className="h-10 w-10" />
            <p className="sop-body-md-medium text-sop-neutral-gray-200">
              {statusText}
            </p>
            {cardAuthorizeUrl && (
              <a
                href={cardAuthorizeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-sop-8px rounded-sop-100px bg-sop-base-white px-sop-16px py-sop-8px sop-body-sm-medium text-sop-primary-600 underline-offset-4 hover:underline"
              >
                เปิดหน้ายืนยันบัตรอีกครั้ง
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="w-full max-w-[420px]">
            <ErrorPanel errorMsg={errorMsg} onRetry={onRetry} />
          </div>
        )}
      </div>
    </section>
  )
}

function splitRecipientName(value: string | null | undefined) {
  const parts = String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const firstName = parts.shift() ?? ""
  return {
    firstName,
    lastName: parts.join(" "),
  }
}

async function syncSavedCheckoutDataToCart(session: CheckoutSessionDto) {
  const payload = getSavedPayload(session)
  const shippingAddress = payload.shippingAddress

  if (!shippingAddress) {
    throw new Error("ไม่พบข้อมูลที่อยู่จัดส่ง")
  }

  const { firstName, lastName } = splitRecipientName(
    shippingAddress.recipientFullName
  )
  const formData = new FormData()
  formData.set("shipping_address.first_name", firstName)
  formData.set("shipping_address.last_name", lastName)
  formData.set("shipping_address.address_1", shippingAddress.address ?? "")
  formData.set("shipping_address.address_2", shippingAddress.district ?? "")
  formData.set("shipping_address.city", shippingAddress.subDistrict ?? "")
  formData.set("shipping_address.province", shippingAddress.province ?? "")
  formData.set("shipping_address.postal_code", shippingAddress.postalCode ?? "")
  formData.set("shipping_address.country_code", "th")
  formData.set(
    "shipping_address.phone",
    normalizeThaiPhoneNumber(shippingAddress.phone)
  )
  formData.set("shipping_address.company", "")

  const email =
    payload.customerSession?.email ||
    shippingAddress.email ||
    (shippingAddress.contactPhone
      ? `${normalizeThaiPhoneNumber(shippingAddress.contactPhone)}@sopet.co.th`
      : "")
  if (email) {
    formData.set("email", email)
  }

  const addressError = await setAddresses(null, formData)
  if (typeof addressError === "string") {
    throw new Error(addressError)
  }

  const optionIds = (payload.shippingMethods ?? [])
    .map((method) => method.optionId)
    .filter((value): value is string => Boolean(value))

  if (!optionIds.length) {
    throw new Error("กรุณาเลือกวิธีจัดส่ง")
  }

  const shippingRes = await setMultiShippingMethods(
    { cartId: session.cart_id, optionIds },
    { skipCacheRevalidate: true }
  )
  if (!shippingRes.ok) {
    throw new Error(
      shippingRes.error?.message || "ไม่สามารถบันทึกวิธีจัดส่งได้"
    )
  }
}

function getCartSnapshot(session: CheckoutSessionDto) {
  const payload = getSavedPayload(session)
  const shippingAddress = payload.shippingAddress
  const email =
    payload.customerSession?.email ||
    shippingAddress?.email ||
    (shippingAddress?.contactPhone
      ? `${normalizeThaiPhoneNumber(shippingAddress.contactPhone)}@sopet.co.th`
      : null)
  const promotionCodes = [
    ...(payload.promotions?.site ?? []),
    ...(payload.promotions?.vendor ?? []),
    ...(payload.coupons?.site ? [payload.coupons.site] : []),
    ...Object.values(payload.coupons?.vendor ?? {}).flat(),
  ].filter(
    (code): code is string => typeof code === "string" && code.length > 0
  )

  return {
    customerId: payload.customerSession?.customerId ?? session.customer_id,
    email,
    customerPhone: shippingAddress?.contactPhone
      ? normalizeThaiPhoneNumber(shippingAddress.contactPhone)
      : null,
    customerEmail: email,
    promotionCodes: [...new Set(promotionCodes)],
  }
}

function getPaymentCollections(
  order: OrderDetails | null,
  session: CheckoutSessionDto
): PaymentCollectionLike[] {
  if (order?.payment_collections?.length) {
    return order.payment_collections as PaymentCollectionLike[]
  }

  return session.payment_collections as PaymentCollectionLike[]
}

function findPaymentSession(
  collections: PaymentCollectionLike[],
  predicate: (session: PaymentSessionLike) => boolean
): PaymentSessionLike | null {
  for (const collection of collections) {
    for (const session of collection.payment_sessions ?? []) {
      if (predicate(session)) {
        return session
      }
    }
  }

  return null
}

function extractQrImageUrl(
  collections: PaymentCollectionLike[]
): string | null {
  const session = findPaymentSession(collections, (s) =>
    Boolean(s.provider_id?.toLowerCase().includes("promptpay"))
  )
  const data = session?.data ?? null

  return (data?.qr_code_url ??
    data?.qr_image_url ??
    data?.redirect_url ??
    null) as string | null
}

function extractPromptPayReference(
  collections: PaymentCollectionLike[]
): string | null {
  const session = findPaymentSession(collections, (s) =>
    Boolean(s.provider_id?.toLowerCase().includes("promptpay"))
  )
  const data = session?.data ?? null
  if (!data) return null

  const candidates = [
    (data as { reference?: unknown }).reference,
    (data as { payment_intent?: unknown }).payment_intent,
    (data as { id?: unknown }).id,
  ]
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) return value
  }
  return null
}

function extractCardAuthorizeUrl(
  collections: PaymentCollectionLike[]
): string | null {
  const session = findPaymentSession(
    collections,
    (s) =>
      !s.provider_id?.toLowerCase().includes("promptpay") &&
      Boolean(s.provider_id)
  )
  const data = session?.data ?? null

  return (data?.authorize_uri ??
    data?.next_action?.redirect_to_url?.url ??
    null) as string | null
}

function extractPromptPayExpiresAtMs(
  collections: PaymentCollectionLike[]
): number | null {
  const session = findPaymentSession(collections, (s) =>
    Boolean(s.provider_id?.toLowerCase().includes("promptpay"))
  )
  const raw = session?.data?.expires_at

  if (typeof raw === "string") {
    const parsed = new Date(raw).getTime()
    if (Number.isFinite(parsed)) return parsed
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 1e12 ? raw : raw * 1000
  }

  const createdAt = session?.created_at
    ? new Date(session.created_at).getTime()
    : null
  if (createdAt != null && Number.isFinite(createdAt)) {
    return createdAt + getPromptPayPendingTtlSeconds() * 1000
  }

  return null
}

function hasPaymentMethodType(
  session: PaymentSessionLike,
  paymentMethod: "card" | "promptpay"
): boolean {
  const raw = session.data?.payment_method_types
  if (!Array.isArray(raw)) {
    return true
  }

  return raw.includes(paymentMethod)
}

const TERMINAL_PAYMENT_SESSION_STATUSES = new Set([
  "error",
  "canceled",
  "cancelled",
  "failed",
])

const TERMINAL_DECLINE_PATTERNS = [
  "card_declined",
  "card declined",
  "do_not_honor",
  "expired_card",
  "expired card",
  "incorrect_cvc",
  "insufficient_funds",
  "insufficient funds",
  "lost_card",
  "stolen_card",
  "authentication_required",
  "authentication failed",
  "payment_intent_authentication_failure",
  "payment_intent_payment_attempt_failed",
  "payment_method_unactivated",
  "processing_error",
  "ยอดเงินไม่เพียงพอ",
  "ถูกปฏิเสธ",
  "ถูกยกเลิก",
]

function classifyCaptureError(
  message: string | null | undefined
): "terminal" | "transient" {
  if (!message) return "transient"
  const lower = message.toLowerCase()
  return TERMINAL_DECLINE_PATTERNS.some((p) => lower.includes(p.toLowerCase()))
    ? "terminal"
    : "transient"
}

function friendlyDeclineMessage(err: {
  code?: string | null
  decline_code?: string | null
  message?: string | null
}): string | null {
  const code = (err.decline_code || err.code || "").toLowerCase()
  switch (code) {
    case "card_declined":
    case "do_not_honor":
    case "generic_decline":
      return "บัตรถูกปฏิเสธ กรุณาลองบัตรอื่นหรือเปลี่ยนวิธีชำระเงิน"
    case "insufficient_funds":
      return "ยอดเงินในบัตรไม่เพียงพอ"
    case "expired_card":
      return "บัตรหมดอายุ"
    case "incorrect_cvc":
      return "รหัส CVC ไม่ถูกต้อง"
    case "lost_card":
    case "stolen_card":
      return "บัตรนี้ไม่สามารถใช้ได้ กรุณาติดต่อธนาคารผู้ออกบัตร"
    case "authentication_required":
    case "payment_intent_authentication_failure":
      return "ยืนยันตัวตนกับธนาคารไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    case "processing_error":
      return "ระบบของธนาคารขัดข้อง กรุณาลองใหม่อีกครั้ง"
    default:
      return err.message ?? null
  }
}

function detectPaymentFailure(
  order: OrderDetails | null,
  collections: PaymentCollectionLike[]
): { failed: true; reason: string } | { failed: false } {
  if (order) {
    if (order.payment_status === "canceled") {
      return { failed: true, reason: "การชำระเงินถูกยกเลิก" }
    }
    for (const collection of order.payment_collections ?? []) {
      for (const payment of collection.payments ?? []) {
        if (
          (payment as { canceled_at?: string | null } | undefined)?.canceled_at
        ) {
          return { failed: true, reason: "การชำระเงินถูกยกเลิก" }
        }
      }
    }
  }

  for (const collection of collections) {
    for (const session of collection.payment_sessions ?? []) {
      const status = session.status?.toLowerCase() ?? null
      const err = session.data?.last_payment_error ?? null

      if (status && TERMINAL_PAYMENT_SESSION_STATUSES.has(status)) {
        return {
          failed: true,
          reason:
            (err && friendlyDeclineMessage(err)) ?? "การชำระเงินไม่สำเร็จ",
        }
      }

      if (err && (err.code || err.decline_code || err.message)) {
        return {
          failed: true,
          reason: friendlyDeclineMessage(err) ?? "การชำระเงินไม่สำเร็จ",
        }
      }
    }
  }

  return { failed: false }
}

export default function PaymentPageClient({
  locale,
  session,
  order: initialOrder,
  providerId,
}: PaymentPageClientProps) {
  const router = useRouter()
  const [currentSession, setCurrentSession] =
    useState<CheckoutSessionDto>(session)
  const [order, setOrder] = useState<OrderDetails | null>(initialOrder)
  const [orderId, setOrderId] = useState<string | null>(session.order_id)
  const [isBootstrapping, setIsBootstrapping] = useState(!session.order_id)
  const [statusText, setStatusText] = useState(
    !session.order_id
      ? "กำลังเตรียมการชำระเงิน…"
      : session.payment_method === "card"
        ? "กำลังประมวลผลการชำระเงินด้วยบัตร…"
        : "รอการชำระเงินผ่าน QR"
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const bootstrapStartedRef = useRef(false)
  const capturingRef = useRef(false)
  const cardAuthOpenedRef = useRef(false)
  const promptpayExpiresAtMsRef = useRef<number | null>(null)

  const paymentMethod = currentSession.payment_method
  const paymentCollections = useMemo(
    () => getPaymentCollections(order, currentSession),
    [currentSession, order]
  )
  const qrImageUrl =
    paymentMethod === "promptpay" ? extractQrImageUrl(paymentCollections) : null
  const qrReference =
    paymentMethod === "promptpay"
      ? extractPromptPayReference(paymentCollections)
      : null
  const cardAuthorizeUrl =
    paymentMethod === "card"
      ? extractCardAuthorizeUrl(paymentCollections)
      : null
  const promptpayExpiresAtMs =
    paymentMethod === "promptpay"
      ? extractPromptPayExpiresAtMs(paymentCollections)
      : null
  const checkoutSessionId = currentSession.id

  useEffect(() => {
    promptpayExpiresAtMsRef.current = promptpayExpiresAtMs
  }, [promptpayExpiresAtMs])

  const { remainingSeconds, isExpired } =
    usePaymentCountdown(promptpayExpiresAtMs)

  const refreshCheckoutSession = useCallback(async () => {
    const refreshed = await getCheckoutSession(checkoutSessionId)
    if (!refreshed.ok) {
      throw new Error(refreshed.message)
    }
    setCurrentSession(refreshed.session)
    setOrderId(refreshed.session.order_id)
    return refreshed.session
  }, [checkoutSessionId])

  useEffect(() => {
    if (!orderId) {
      setOrder(null)
      return
    }

    let cancelled = false

    void retrieveOrder(orderId, { checkoutSessionId })
      .then((nextOrder) => {
        if (!cancelled) {
          setOrder(nextOrder)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [checkoutSessionId, orderId])

  const finalize = useCallback(
    async (nextOrderId: string) => {
      if (capturingRef.current) return
      capturingRef.current = true

      let lastError: string | null = null
      let attempt = 0

      while (true) {
        const baseWait =
          paymentMethod === "promptpay"
            ? attempt === 0
              ? 0
              : PROMPTPAY_POLL_INTERVAL_MS
            : (CARD_CAPTURE_BACKOFFS_MS[attempt] ?? null)

        if (baseWait == null) break
        if (baseWait > 0) {
          await waitInterruptible(baseWait, () => false)
        }

        const sessionRes = await getCheckoutSession(checkoutSessionId).catch(
          () => null
        )
        if (sessionRes?.ok && sessionRes.session.status === "failed") {
          lastError =
            sessionRes.session.failure_reason || "การชำระเงินไม่สำเร็จ"
          break
        }
        if (sessionRes?.ok && sessionRes.session.status === "captured") {
          await clearCheckoutCartCookie().catch(() => undefined)
          router.push(`/${locale}`)
          return
        }

        const res = await captureOrderPayment(nextOrderId, {
          checkoutSessionId,
        })

        if (res.success) {
          const fresh = await retrieveOrder(nextOrderId, {
            checkoutSessionId,
          }).catch(() => null)
          const isPaid =
            (fresh?.metadata as { is_paid?: unknown } | null | undefined)
              ?.is_paid === true

          if (isPaid) {
            await setCheckoutSessionStatus(checkoutSessionId, "captured").catch(
              () => undefined
            )
            await clearCheckoutCartCookie().catch(() => undefined)
            router.push(`/${locale}`)
            return
          }

          const freshCollections = (
            fresh?.payment_collections?.length
              ? (fresh.payment_collections as PaymentCollectionLike[])
              : getPaymentCollections(fresh, session)
          ) as PaymentCollectionLike[]
          const failure = detectPaymentFailure(fresh, freshCollections)
          if (failure.failed) {
            lastError = failure.reason
            break
          }

          lastError = "ยังไม่ได้รับการยืนยันการชำระเงิน"
        } else {
          lastError = res.error ?? null
          if (classifyCaptureError(res.error) === "terminal") {
            break
          }
        }
        setStatusText(
          paymentMethod === "promptpay"
            ? "รอการยืนยันการชำระเงินจากธนาคาร…"
            : "กำลังยืนยันการชำระเงินกับธนาคาร…"
        )

        if (paymentMethod === "promptpay") {
          const deadline =
            promptpayExpiresAtMsRef.current ??
            Date.now() + getPromptPayPendingTtlSeconds() * 1000
          if (Date.now() > deadline + PROMPTPAY_GRACE_MS) {
            break
          }
        }

        attempt += 1
      }

      capturingRef.current = false
      const msg = lastError || "ยืนยันการชำระเงินไม่สำเร็จ"
      setErrorMsg(msg)
      setStatusText("ชำระเงินไม่สำเร็จ")
      await setCheckoutSessionStatus(checkoutSessionId, "failed", {
        failure_reason: msg,
      }).catch(() => undefined)
      toast.error({ title: "ชำระเงินไม่สำเร็จ", description: msg })
    },
    [checkoutSessionId, locale, paymentMethod, router, session]
  )

  useEffect(() => {
    if (orderId || bootstrapStartedRef.current) return
    bootstrapStartedRef.current = true

    // First-visit flow: replay the saved checkout snapshot onto the cart,
    // bootstrap marketplace payment sessions, place the order, and link the
    // resulting order/collection/session ids back onto the checkout session.
    // Refreshes after this point skip the whole effect because `orderId` is set.
    const run = async () => {
      try {
        if (!providerId) {
          throw new Error("ไม่พบผู้ให้บริการชำระเงิน")
        }

        const returnUri = `${window.location.origin}/${locale}/payment/${currentSession.id}`
        const sessionData: Record<string, unknown> = {
          payment_method_types: [paymentMethod],
          return_uri:
            paymentMethod === "card"
              ? `${returnUri}?${CARD_3DS_RETURN_PARAM}=1`
              : returnUri,
        }

        if (paymentMethod === "card") {
          if (currentSession.saved_card_id) {
            sessionData.customer_payment_method_id =
              currentSession.saved_card_id
          } else if (currentSession.omise_token) {
            sessionData.omise_token = currentSession.omise_token
          } else {
            throw new Error("ไม่พบข้อมูลบัตรสำหรับชำระเงิน")
          }
        }

        await syncSavedCheckoutDataToCart(currentSession)

        const bootstrap = await bootstrapMarketplacePaymentSessions(
          currentSession.cart_id,
          { provider_id: providerId, data: sessionData }
        )

        const paymentCollectionIds = bootstrap.marketplaceCheckout.slices.map(
          (slice) => slice.payment_collection_id
        )
        const paymentSessionIds = paymentCollectionIds.flatMap(
          (collectionId) => {
            const collection = bootstrap.collectionsById[collectionId]
            const paymentSession = collection?.payment_sessions?.find(
              (session) =>
                session.provider_id === providerId &&
                hasPaymentMethodType(
                  session as PaymentSessionLike,
                  paymentMethod
                )
            )
            return paymentSession?.id ? [paymentSession.id] : []
          }
        )

        const completeRes = await completeMarketplaceOrder(
          currentSession.cart_id,
          {
            redirect: false,
            providerId,
            paymentMethodType: paymentMethod,
            paymentSessionIds,
            cartSnapshot: getCartSnapshot(currentSession),
          }
        )

        const newOrderId = getOrderIdFromPlaceOrderResponse(completeRes)
        if (!newOrderId) {
          const msg =
            (completeRes as { error?: { message?: string } })?.error?.message ||
            "ไม่สามารถสร้างคำสั่งซื้อได้"
          throw new Error(msg)
        }

        const attached = await attachCheckoutSessionOrder({
          id: currentSession.id,
          order_id: newOrderId,
          payment_collection_ids: paymentCollectionIds,
          payment_session_ids: paymentSessionIds,
        })

        if (!attached.ok) {
          throw new Error(attached.message || "ไม่สามารถบันทึกคำสั่งซื้อได้")
        }

        await refreshCheckoutSession()
        setIsBootstrapping(false)
        setStatusText(
          paymentMethod === "card"
            ? "กำลังประมวลผลการชำระเงินด้วยบัตร…"
            : "สแกน QR เพื่อชำระเงิน"
        )
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการชำระเงิน"
        setErrorMsg(msg)
        setStatusText("เตรียมการชำระเงินไม่สำเร็จ")
        setIsBootstrapping(false)
        toast.error({ title: "ชำระเงินไม่สำเร็จ", description: msg })
      }
    }

    void run()
  }, [
    currentSession,
    locale,
    orderId,
    paymentMethod,
    providerId,
    refreshCheckoutSession,
  ])

  useEffect(() => {
    if (!orderId || isBootstrapping || errorMsg) return

    if (paymentMethod === "card" && cardAuthorizeUrl) {
      const storageKey = `sopet:card-auth-opened:${checkoutSessionId}`
      const alreadyOpened =
        typeof window !== "undefined" &&
        window.localStorage.getItem(storageKey) === "1"
      const returnedFrom3ds =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get(
          CARD_3DS_RETURN_PARAM
        ) === "1"

      if (!returnedFrom3ds && (alreadyOpened || cardAuthOpenedRef.current)) {
        setStatusText("รอการยืนยันบัตร")
        return
      }

      if (!alreadyOpened && !returnedFrom3ds) {
        cardAuthOpenedRef.current = true
        try {
          window.localStorage.setItem(storageKey, "1")
        } catch {
          // ignore storage errors (private mode, quota, etc.)
        }
        window.location.assign(cardAuthorizeUrl)
        return
      }

      if (!returnedFrom3ds) {
        return
      }
    }

    void finalize(orderId)
  }, [
    cardAuthorizeUrl,
    errorMsg,
    finalize,
    checkoutSessionId,
    isBootstrapping,
    orderId,
    paymentMethod,
  ])

  useEffect(() => {
    if (paymentMethod !== "promptpay") return
    if (!isExpired || !orderId || errorMsg) return

    const reason = "หมดเวลา QR กรุณาลองใหม่อีกครั้ง"
    setErrorMsg(reason)
    setStatusText("หมดเวลา QR")
    void setCheckoutSessionStatus(currentSession.id, "failed", {
      failure_reason: reason,
      failure_code: "promptpay_qr_expired",
    }).catch(() => undefined)
  }, [currentSession.id, errorMsg, isExpired, orderId, paymentMethod])

  if (paymentMethod === "promptpay") {
    const hms =
      remainingSeconds != null ? formatCountdownHms(remainingSeconds) : null

    return (
      <PromptPayPaymentView
        qrImageUrl={qrImageUrl}
        qrReference={qrReference}
        hms={hms}
        isBootstrapping={isBootstrapping}
        errorMsg={errorMsg}
        session={currentSession}
        order={order}
        orderId={orderId}
      />
    )
  }

  return (
    <div>
      <main>
        <CardPaymentView
          statusText={statusText}
          errorMsg={errorMsg}
          cardAuthorizeUrl={cardAuthorizeUrl}
          onRetry={() => window.location.reload()}
        />
      </main>
    </div>
  )
}

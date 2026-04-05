import type { OrderDetails, OrderPaymentSession } from "@/types/order"
import { readOrderPromptPayContinuity } from "@/lib/helpers/order-promptpay-continuity"
import { isOrderPaymentSessionSelectableForCheckout } from "@/lib/helpers/order-checkout-payment"

/**
 * Wall-clock TTL for PromptPay pending QR sessions. Stripe/bank windows vary;
 * override with NEXT_PUBLIC_PROMPTPAY_PENDING_TTL_SECONDS when product confirms.
 */
export function getPromptPayPendingTtlSeconds(): number {
  const raw = process.env["NEXT_PUBLIC_PROMPTPAY_PENDING_TTL_SECONDS"]
  if (raw != null && raw !== "") {
    const n = Number.parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) {
      return n
    }
  }
  return 180
}

export function getActivePendingPromptPaySession(
  order: Pick<OrderDetails, "payment_collections">
): OrderPaymentSession | null {
  const sessions = order.payment_collections?.[0]?.payment_sessions ?? []
  const sorted = [...sessions].sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime()
    const tb = new Date(b.created_at ?? 0).getTime()
    return tb - ta
  })
  return (
    sorted.find(
      (s) =>
        isOrderPaymentSessionSelectableForCheckout(s.status) &&
        typeof s.provider_id === "string" &&
        s.provider_id.toLowerCase().includes("promptpay")
    ) ?? null
  )
}

export function getPendingPromptPayExpiresAtMs(
  session: Pick<OrderPaymentSession, "created_at"> | null
): number | null {
  if (!session?.created_at) {
    return null
  }
  const created = new Date(session.created_at).getTime()
  if (Number.isNaN(created)) {
    return null
  }
  return created + getPromptPayPendingTtlSeconds() * 1000
}

/** Stripe PaymentIntent `created` is Unix seconds. */
export function getPromptPayExpiresAtMsFromStripeIntentCreated(
  createdUnixSeconds: number | undefined
): number {
  if (
    typeof createdUnixSeconds !== "number" ||
    !Number.isFinite(createdUnixSeconds)
  ) {
    return Date.now() + getPromptPayPendingTtlSeconds() * 1000
  }
  return createdUnixSeconds * 1000 + getPromptPayPendingTtlSeconds() * 1000
}

/**
 * UI countdown deadline when the customer starts PromptPay checkout (e.g. clicks ชำระเงิน).
 * Do not use Medusa `payment_session.created_at` for this — it can be from an earlier prepare
 * and makes the timer show "หมดเวลา" as soon as the pending page opens.
 */
export function getPromptPayCheckoutClickDeadlineMs(): number {
  return Date.now() + getPromptPayPendingTtlSeconds() * 1000
}

/** Uses checkout-persisted deadline when session still matches the same client secret. */
export function resolvePendingPromptPayExpiresAtMs(
  orderId: string | undefined,
  session: OrderPaymentSession | null
): number | null {
  const fallback = getPendingPromptPayExpiresAtMs(session)
  const secret = session?.data?.client_secret
  if (!orderId || typeof secret !== "string") {
    return fallback
  }
  const cont = readOrderPromptPayContinuity(orderId)
  if (cont?.clientSecret === secret) {
    return cont.qrExpiresAtMs
  }
  return fallback
}

export function formatCountdownHms(totalSeconds: number): {
  h: string
  m: string
  s: string
} {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  }
}

/**
 * Persists PromptPay deadline (and optional QR) per order so the countdown on
 * order management matches checkout when the same PaymentIntent / client_secret is used.
 */
const keyFor = (orderId: string) =>
  `sopet:order_promptpay_continuity:v1:${orderId}`

export type OrderPromptPayContinuityV1 = {
  v: 1
  clientSecret: string
  qrExpiresAtMs: number
  qrImageUrl?: string | null
  sessionCreatedAt?: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export function writeOrderPromptPayContinuity(
  orderId: string,
  data: Omit<OrderPromptPayContinuityV1, "v">
): void {
  if (typeof window === "undefined") return
  const payload: OrderPromptPayContinuityV1 = { v: 1, ...data }
  try {
    sessionStorage.setItem(keyFor(orderId), JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function readOrderPromptPayContinuity(
  orderId: string
): OrderPromptPayContinuityV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(keyFor(orderId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.v !== 1) return null
    const clientSecret = parsed.clientSecret
    const qrExpiresAtMs = parsed.qrExpiresAtMs
    if (typeof clientSecret !== "string" || typeof qrExpiresAtMs !== "number") {
      return null
    }
    const qrImageUrl =
      typeof parsed.qrImageUrl === "string"
        ? parsed.qrImageUrl
        : parsed.qrImageUrl === null
          ? null
          : undefined
    const sessionCreatedAt =
      typeof parsed.sessionCreatedAt === "string"
        ? parsed.sessionCreatedAt
        : parsed.sessionCreatedAt === null
          ? null
          : undefined
    return {
      v: 1,
      clientSecret,
      qrExpiresAtMs,
      ...(qrImageUrl !== undefined ? { qrImageUrl } : {}),
      ...(sessionCreatedAt !== undefined ? { sessionCreatedAt } : {}),
    }
  } catch {
    return null
  }
}

export function clearOrderPromptPayContinuity(orderId: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(keyFor(orderId))
  } catch {
    // ignore
  }
}

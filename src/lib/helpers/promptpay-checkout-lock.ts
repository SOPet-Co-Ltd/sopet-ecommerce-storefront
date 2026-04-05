const STORAGE_KEY = "sopet:promptpay_checkout_lock:v1"

export type PromptPayCheckoutLockV1 = {
  v: 1
  cartId: string
  /** Set when early `completeMarketplaceOrder` succeeded (order visible as pending payment). */
  orderId: string | null
  clientSecret: string
  locale: string
  qrImageUrl: string | null
  qrExpiresAtMs: number
  sessionCreatedAt?: string | null
  mode: "qr" | "processing" | "redirect"
  /** Present when Stripe uses `redirect_to_url` instead of an embedded QR image. */
  redirectUrl?: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

export function writePromptPayCheckoutLock(
  data: Omit<PromptPayCheckoutLockV1, "v">
): void {
  if (typeof window === "undefined") return
  const payload: PromptPayCheckoutLockV1 = { v: 1, ...data }
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function readPromptPayCheckoutLock(): PromptPayCheckoutLockV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.v !== 1) return null
    const cartId = parsed.cartId
    const clientSecret = parsed.clientSecret
    const locale = parsed.locale
    const qrExpiresAtMs = parsed.qrExpiresAtMs
    if (
      typeof cartId !== "string" ||
      typeof clientSecret !== "string" ||
      typeof locale !== "string" ||
      typeof qrExpiresAtMs !== "number"
    ) {
      return null
    }
    const mode =
      parsed.mode === "processing"
        ? "processing"
        : parsed.mode === "redirect"
          ? "redirect"
          : "qr"
    const orderId = typeof parsed.orderId === "string" ? parsed.orderId : null
    const qrImageUrl =
      typeof parsed.qrImageUrl === "string"
        ? parsed.qrImageUrl
        : parsed.qrImageUrl === null
          ? null
          : null
    const redirectUrl =
      typeof parsed.redirectUrl === "string"
        ? parsed.redirectUrl
        : parsed.redirectUrl === null
          ? null
          : undefined

    return {
      v: 1,
      cartId,
      orderId,
      clientSecret,
      locale,
      qrImageUrl,
      qrExpiresAtMs,
      sessionCreatedAt:
        typeof parsed.sessionCreatedAt === "string"
          ? parsed.sessionCreatedAt
          : parsed.sessionCreatedAt === null
            ? null
            : undefined,
      mode,
      ...(redirectUrl !== undefined ? { redirectUrl } : {}),
    }
  } catch {
    return null
  }
}

export function clearPromptPayCheckoutLock(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function isPromptPayLockedForCart(cartId: string): boolean {
  const lock = readPromptPayCheckoutLock()
  return Boolean(lock && lock.cartId === cartId)
}

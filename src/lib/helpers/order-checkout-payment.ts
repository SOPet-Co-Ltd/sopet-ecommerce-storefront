import type { OrderDetails, OrderPaymentSession } from "@/types/order"

function paymentCollectionIdSetEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  const sa = new Set(a)
  for (const x of b) {
    if (!sa.has(x)) {
      return false
    }
  }
  return true
}

/**
 * Ensures the backend mutated the same payment collections the UI shows (merged cart / multi-seller).
 */
export function assertOrderPaymentSessionCollectionsMatch(
  apiCollectionIds: string[] | undefined,
  uiCollectionIds: string[] | undefined
): void {
  if (!apiCollectionIds?.length || !uiCollectionIds?.length) {
    return
  }
  if (!paymentCollectionIdSetEqual(apiCollectionIds, uiCollectionIds)) {
    throw new Error(
      "การอัปเดตช่องทางชำระเงินไม่สอดคล้องกับคำสั่งซื้อ กรุณารีเฟรชแล้วลองอีกครั้ง"
    )
  }
}

/** Client secrets from POST /store/orders/:id/payment-session for pay modal bootstrap. */
export type OrderPaymentChangeBootstrap = {
  clientSecrets: string[]
  sessionIds: string[]
}

export function bootstrapFromOrderPaymentSessions(
  sessions: OrderPaymentSession[]
): OrderPaymentChangeBootstrap {
  const clientSecrets: string[] = []
  const sessionIds: string[] = []
  for (const s of sessions) {
    const secret = s.data?.client_secret
    if (typeof secret === "string" && secret.length > 0) {
      clientSecrets.push(secret)
      sessionIds.push(s.id)
    }
  }
  return { clientSecrets, sessionIds }
}

/**
 * Maps API sessions to the same payment_collection order as the order detail / list UI
 * so multi-seller card checkout confirms intents in the correct slice order.
 */
export function bootstrapFromOrderPaymentSessionsAligned(
  sessions: OrderPaymentSession[],
  preferredCollectionIds?: string[] | null
): OrderPaymentChangeBootstrap {
  if (!preferredCollectionIds?.length) {
    return bootstrapFromOrderPaymentSessions(sessions)
  }
  const byCol = new Map<string, OrderPaymentSession>()
  for (const s of sessions) {
    const pc = s.payment_collection_id
    if (typeof pc === "string" && pc.length > 0 && !byCol.has(pc)) {
      byCol.set(pc, s)
    }
  }
  const clientSecrets: string[] = []
  const sessionIds: string[] = []
  for (const colId of preferredCollectionIds) {
    const s = byCol.get(colId)
    const secret = s?.data?.client_secret
    if (typeof secret === "string" && secret.length > 0 && s) {
      clientSecrets.push(secret)
      sessionIds.push(s.id)
    }
  }
  if (clientSecrets.length === 0) {
    return bootstrapFromOrderPaymentSessions(sessions)
  }
  return { clientSecrets, sessionIds }
}

const paymentProviderStorageKey = (orderId: string) =>
  `order_${orderId}_paymentProvider`

/** Persist chosen channel after "เปลี่ยนช่องทาง" so Pay uses the same session before RSC refresh. */
export function setStoredOrderPaymentProviderId(
  orderId: string,
  providerId: string | null
): void {
  if (typeof window === "undefined") {
    return
  }
  const key = paymentProviderStorageKey(orderId)
  if (providerId?.trim()) {
    sessionStorage.setItem(key, providerId.trim())
  } else {
    sessionStorage.removeItem(key)
  }
}

function getStoredOrderPaymentProviderId(orderId: string): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return (
    sessionStorage.getItem(paymentProviderStorageKey(orderId))?.trim() || null
  )
}

function sortSessionsNewestFirst(
  sessions: OrderPaymentSession[]
): OrderPaymentSession[] {
  return [...sessions].sort((a, b) => {
    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    )
  })
}

/**
 * Sessions the customer can still complete payment with (same PI / client_secret).
 * Medusa often stores `authorized` after cart `authorizePayment` even while Stripe is
 * still `requires_action` (PromptPay) or awaiting card confirmation — not only `pending`.
 */
export function isOrderPaymentSessionSelectableForCheckout(
  status: string | undefined
): boolean {
  const st = (status ?? "").toLowerCase()
  return st === "pending" || st === "requires_more" || st === "authorized"
}

function collectSelectableSessionsFromOrder(
  order: Pick<OrderDetails, "payment_collections">
): OrderPaymentSession[] {
  const cols = order.payment_collections ?? []
  const out: OrderPaymentSession[] = []
  for (const col of cols) {
    const sessions = col?.payment_sessions ?? []
    for (const s of sessions) {
      if (
        isOrderPaymentSessionSelectableForCheckout(s.status) &&
        typeof s.provider_id === "string"
      ) {
        out.push(s)
      }
    }
  }
  return sortSessionsNewestFirst(out)
}

/**
 * Provider the customer chose: sessionStorage (after change payment), order field,
 * else newest selectable session across all payment collections.
 */
export function resolveOrderCheckoutProviderId(
  order: Pick<
    OrderDetails,
    "id" | "payment_provider_id" | "payment_collections"
  >
): string | null {
  const stored = getStoredOrderPaymentProviderId(order.id)
  if (stored) {
    return stored
  }

  const selectableSessions = collectSelectableSessionsFromOrder(order)

  const fromOrder = order.payment_provider_id?.trim()
  if (fromOrder) {
    const matchesOrder = selectableSessions.some(
      (s) =>
        s.provider_id.toLowerCase() === fromOrder.toLowerCase() ||
        providerMatchesPreferred(s.provider_id, fromOrder)
    )
    if (matchesOrder || selectableSessions.length === 0) {
      return fromOrder
    }
  }

  return selectableSessions[0]?.provider_id ?? null
}

function providerMatchesPreferred(
  sessionProvider: string,
  preferred: string
): boolean {
  const s = sessionProvider.toLowerCase()
  const p = preferred.toLowerCase()
  if (s === p) {
    return true
  }
  const sessionPromptPay = s.includes("promptpay")
  const prefPromptPay = p.includes("promptpay")
  const sessionCard =
    s.includes("card") || (s.includes("omise") && !s.includes("promptpay"))
  const prefCard =
    p.includes("card") || (p.includes("omise") && !p.includes("promptpay"))
  if (prefPromptPay && sessionPromptPay) {
    return true
  }
  if (prefCard && sessionCard) {
    return true
  }
  return false
}

/**
 * Pick the pending session that matches the order's selected provider when possible.
 */
export function pickPendingPaymentSessionForCheckout(
  sessions: OrderPaymentSession[] | undefined,
  preferredProviderId: string | null
): OrderPaymentSession | undefined {
  if (!sessions?.length) {
    return undefined
  }

  const withSecret = sortSessionsNewestFirst(sessions).filter(
    (s) =>
      isOrderPaymentSessionSelectableForCheckout(s.status) &&
      typeof s.provider_id === "string" &&
      typeof s.data?.client_secret === "string" &&
      s.data.client_secret.length > 0
  )

  if (withSecret.length === 0) {
    return undefined
  }

  if (preferredProviderId) {
    const exact = withSecret.find(
      (s) => s.provider_id.toLowerCase() === preferredProviderId.toLowerCase()
    )
    if (exact) {
      return exact
    }
    const fuzzy = withSecret.find((s) =>
      providerMatchesPreferred(s.provider_id, preferredProviderId)
    )
    if (fuzzy) {
      return fuzzy
    }
  }

  return withSecret[0]
}

/**
 * Stable fingerprint for payment collection + sessions so effects do not re-run
 * when the parent passes a new `order` object reference with the same payment data.
 */
export function getOrderPaymentSessionsSyncKey(
  order: Pick<OrderDetails, "id" | "payment_collections"> | null | undefined
): string {
  if (!order?.id) {
    return ""
  }
  const cols = order.payment_collections ?? []
  if (!cols.length) {
    return `${order.id}:no-collection`
  }
  const segments = cols.map((coll) => {
    if (!coll?.id) {
      return "no-id"
    }
    const parts = (coll.payment_sessions ?? [])
      .map((s) => {
        const hasSecret =
          typeof s.data?.client_secret === "string" &&
          s.data.client_secret.length > 0
        return `${String(s.id ?? "")}:${String(s.status ?? "")}:${String(s.provider_id ?? "")}:${hasSecret ? "1" : "0"}`
      })
      .sort()
    return `${coll.id}:${parts.join("|")}`
  })
  return `${order.id}:${segments.join("||")}`
}

export function mapProviderIdToChangePaymentUiMethod(
  providerId: string | null | undefined
): "card" | "promptpay" | undefined {
  if (!providerId?.trim()) {
    return undefined
  }
  const p = providerId.toLowerCase()
  if (p.includes("promptpay")) {
    return "promptpay"
  }
  return "card"
}

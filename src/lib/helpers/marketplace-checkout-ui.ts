import type { HttpTypes } from "@medusajs/types"
import type { MpCheckoutV1 } from "@/types/marketplace-checkout"

export function isCardProviderId(providerId?: string) {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  return !id.includes("promptpay") && !id.includes("pp_system_default")
}

export function isPromptpayProviderId(providerId?: string) {
  return providerId?.toLowerCase().includes("promptpay")
}

function toNumericAmount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === "object") {
    const numericValue = (value as { numeric_?: unknown }).numeric_
    if (typeof numericValue === "number" && Number.isFinite(numericValue)) {
      return numericValue
    }
    if (typeof numericValue === "string") {
      const parsed = Number(numericValue)
      return Number.isFinite(parsed) ? parsed : 0
    }

    const amountValue = (value as { amount?: unknown }).amount
    if (typeof amountValue === "number" && Number.isFinite(amountValue)) {
      return amountValue
    }
    if (typeof amountValue === "string") {
      const parsed = Number(amountValue)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  return 0
}

function sliceRawTotalRequiresPayment(
  slice: { raw_total?: unknown } | undefined
) {
  return toNumericAmount(slice?.raw_total) > 0
}

export function collectionRequiresPayment(
  collection: HttpTypes.StorePaymentCollection | undefined
): boolean {
  if (!collection) {
    return false
  }

  const rawAmount = (collection as { raw_amount?: unknown }).raw_amount
  const amount = toNumericAmount(rawAmount ?? collection.amount ?? 0)
  return amount > 0
}

function sessionMatchesMethodType(
  session: HttpTypes.StorePaymentSession,
  methodType: "card" | "promptpay"
): boolean {
  if (methodType === "promptpay")
    return isPromptpayProviderId(session.provider_id) ?? false
  return isCardProviderId(session.provider_id)
}

function sessionCreatedAtMs(session: HttpTypes.StorePaymentSession): number {
  const createdAt = (session as { created_at?: string | null }).created_at
  const parsed = createdAt ? new Date(createdAt).getTime() : 0
  return Number.isFinite(parsed) ? parsed : 0
}

export function isCheckoutSelectablePaymentSessionStatus(
  status: string | undefined
): boolean {
  const normalized = (status ?? "").toLowerCase()
  return (
    normalized === "pending" ||
    normalized === "requires_more" ||
    normalized === "authorized"
  )
}

export function isCheckoutSelectablePaymentSession(
  session: HttpTypes.StorePaymentSession | undefined
): session is HttpTypes.StorePaymentSession {
  if (!session) {
    return false
  }

  return isCheckoutSelectablePaymentSessionStatus(String(session.status))
}

export function findPaymentSessionForSlice(
  collection: HttpTypes.StorePaymentCollection | undefined,
  methodType: "card" | "promptpay",
  providerId?: string
): HttpTypes.StorePaymentSession | undefined {
  if (!collection?.payment_sessions?.length) return undefined

  const matchesMethod = (s: HttpTypes.StorePaymentSession) =>
    methodType === "promptpay"
      ? (isPromptpayProviderId(s.provider_id) ?? false)
      : isCardProviderId(s.provider_id)

  const sortNewestFirst = (sessions: HttpTypes.StorePaymentSession[]) =>
    [...sessions].sort((a, b) => sessionCreatedAtMs(b) - sessionCreatedAtMs(a))

  const strict = collection.payment_sessions.filter(
    (s) => (!providerId || s.provider_id === providerId) && matchesMethod(s)
  )
  const pool = strict.length
    ? strict
    : collection.payment_sessions.filter(matchesMethod)

  const selectablePool = sortNewestFirst(
    pool.filter(isCheckoutSelectablePaymentSession)
  )
  const selectableMatch = selectablePool.find((s) =>
    sessionMatchesMethodType(s, methodType)
  )
  if (selectableMatch) {
    return selectableMatch
  }
  if (selectablePool[0]) {
    return selectablePool[0]
  }

  const sortedPool = sortNewestFirst(pool)
  const match = sortedPool.find((s) => sessionMatchesMethodType(s, methodType))
  return match || sortedPool[0]
}

/** @deprecated use findPaymentSessionForSlice */
export const findStripeSessionForSlice = findPaymentSessionForSlice

/** @deprecated use isCheckoutSelectablePaymentSession */
export const isCheckoutSelectableStripeSession =
  isCheckoutSelectablePaymentSession

export function sliceCollectionAuthorized(
  collection: HttpTypes.StorePaymentCollection | undefined
): boolean {
  if (!collection) return false
  if (!collectionRequiresPayment(collection)) return true
  if (collection.status === "authorized") return true
  return (
    collection.payment_sessions?.some((s) => {
      const st = s.status as string
      return st === "authorized" || st === "succeeded"
    }) ?? false
  )
}

export function allMarketplaceSlicesAuthorized(
  mp: MpCheckoutV1,
  byCollectionId: Record<string, HttpTypes.StorePaymentCollection | undefined>
): boolean {
  return mp.slices.every((slice) =>
    sliceCollectionAuthorized(byCollectionId[slice.payment_collection_id])
  )
}

export function countPayableMarketplaceSlices(
  mp: MpCheckoutV1,
  byCollectionId: Record<string, HttpTypes.StorePaymentCollection | undefined>
): number {
  return mp.slices.reduce((count, slice) => {
    const collection = byCollectionId[slice.payment_collection_id]
    return (
      count +
      (collectionRequiresPayment(collection) ||
      sliceRawTotalRequiresPayment(slice)
        ? 1
        : 0)
    )
  }, 0)
}

export function getMarketplaceClientSecretsInOrder(
  mp: MpCheckoutV1,
  byCollectionId: Record<string, HttpTypes.StorePaymentCollection | undefined>,
  methodType: "card" | "promptpay",
  providerId?: string
): string[] {
  return getMarketplaceSessionsInOrder(
    mp,
    byCollectionId,
    methodType,
    providerId
  )
    .map((session) => session.data?.client_secret as string | undefined)
    .filter(
      (secret): secret is string =>
        typeof secret === "string" && secret.length > 0
    )
}

export function getMarketplaceSessionsInOrder(
  mp: MpCheckoutV1,
  byCollectionId: Record<string, HttpTypes.StorePaymentCollection | undefined>,
  methodType: "card" | "promptpay",
  providerId?: string
): HttpTypes.StorePaymentSession[] {
  const sessions: HttpTypes.StorePaymentSession[] = []
  for (const slice of mp.slices) {
    const pc = byCollectionId[slice.payment_collection_id]
    if (
      !collectionRequiresPayment(pc) &&
      !sliceRawTotalRequiresPayment(slice)
    ) {
      continue
    }
    const session = findStripeSessionForSlice(pc, methodType, providerId)
    if (session) {
      sessions.push(session)
    }
  }
  return sessions
}

type PromptPayCollectionLike = {
  id?: string
  payment_sessions?: Array<{
    provider_id?: string | null
    data?: Record<string, unknown> | null
  }> | null
  payments?: Array<{ data?: Record<string, unknown> | null }> | null
}

function readPromptPayQrFromProviderData(
  data: Record<string, unknown> | null | undefined
): string | null {
  if (!data) {
    return null
  }

  for (const key of ["qr_code_url", "qr_image_url", "redirect_url"] as const) {
    const value = data[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }

  const source = data.source
  if (source && typeof source === "object") {
    const scannable = (source as { scannable_code?: unknown }).scannable_code
    if (scannable && typeof scannable === "object") {
      const image = (scannable as { image?: unknown }).image
      if (image && typeof image === "object") {
        const downloadUri = (image as { download_uri?: unknown }).download_uri
        if (typeof downloadUri === "string" && downloadUri.length > 0) {
          return downloadUri
        }
      }
    }
  }

  return null
}

/** Resolve PromptPay QR URL from marketplace payment collections (sessions or payments). */
export function extractPromptPayQrImageUrl(
  collections: PromptPayCollectionLike[]
): string | null {
  for (const collection of collections) {
    for (const session of collection.payment_sessions ?? []) {
      if (!isPromptpayProviderId(session.provider_id ?? undefined)) {
        continue
      }
      const qr = readPromptPayQrFromProviderData(
        (session.data as Record<string, unknown> | null | undefined) ?? null
      )
      if (qr) {
        return qr
      }
    }

    for (const payment of collection.payments ?? []) {
      const qr = readPromptPayQrFromProviderData(
        (payment.data as Record<string, unknown> | null | undefined) ?? null
      )
      if (qr) {
        return qr
      }
    }
  }

  return null
}

export function mergeCheckoutPaymentCollections<
  T extends PromptPayCollectionLike,
>(orderCollections: T[] | undefined, sessionCollections: T[] | undefined): T[] {
  const merged = new Map<string, T>()

  for (const collection of sessionCollections ?? []) {
    if (collection?.id) {
      merged.set(collection.id, collection)
    }
  }

  for (const collection of orderCollections ?? []) {
    if (!collection?.id) {
      continue
    }

    const existing = merged.get(collection.id)
    if (!existing) {
      merged.set(collection.id, collection)
      continue
    }

    const existingHasQr = extractPromptPayQrImageUrl([existing]) != null
    const incomingHasQr = extractPromptPayQrImageUrl([collection]) != null

    if (incomingHasQr && !existingHasQr) {
      merged.set(collection.id, collection)
      continue
    }

    merged.set(collection.id, {
      ...existing,
      ...collection,
      payment_sessions:
        collection.payment_sessions?.length && !existingHasQr
          ? collection.payment_sessions
          : existing.payment_sessions?.length
            ? existing.payment_sessions
            : collection.payment_sessions,
      payments:
        collection.payments?.length && !existingHasQr
          ? collection.payments
          : existing.payments?.length
            ? existing.payments
            : collection.payments,
    })
  }

  return Array.from(merged.values())
}

export function collectMarketplacePromptPaySessionIds(
  mp: MpCheckoutV1,
  collectionsById: Record<string, HttpTypes.StorePaymentCollection>,
  providerId?: string
): string[] {
  return getMarketplaceSessionsInOrder(
    mp,
    collectionsById,
    "promptpay",
    providerId
  )
    .map((session) => session.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
}

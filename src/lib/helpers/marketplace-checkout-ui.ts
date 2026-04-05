import type { HttpTypes } from "@medusajs/types"
import type { MpCheckoutV1 } from "@/types/marketplace-checkout"
import { isStripe } from "@/lib/constants"

export function isStripeProviderId(providerId?: string) {
  return providerId === "stripe" || isStripe(providerId)
}

export function isPromptpayProviderId(providerId?: string) {
  return providerId?.toLowerCase().includes("promptpay")
}

function sessionMatchesMethodType(
  session: HttpTypes.StorePaymentSession,
  methodType: "card" | "promptpay"
): boolean {
  if (!isStripeProviderId(session.provider_id)) return false
  const data = session.data as { payment_method_types?: string[] } | undefined
  const types = data?.payment_method_types
  if (!Array.isArray(types)) return false
  return types.includes(methodType)
}

export function findStripeSessionForSlice(
  collection: HttpTypes.StorePaymentCollection | undefined,
  methodType: "card" | "promptpay",
  providerId?: string
): HttpTypes.StorePaymentSession | undefined {
  if (!collection?.payment_sessions?.length) return undefined

  const stripeish = (s: HttpTypes.StorePaymentSession) =>
    isStripeProviderId(s.provider_id) || isPromptpayProviderId(s.provider_id)

  const strict = collection.payment_sessions.filter(
    (s) => (!providerId || s.provider_id === providerId) && stripeish(s)
  )
  const pool = strict.length
    ? strict
    : collection.payment_sessions.filter(stripeish)

  const match = pool.find((s) => sessionMatchesMethodType(s, methodType))
  return match || pool[0]
}

export function sliceCollectionAuthorized(
  collection: HttpTypes.StorePaymentCollection | undefined
): boolean {
  if (!collection) return false
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

export function getMarketplaceClientSecretsInOrder(
  mp: MpCheckoutV1,
  byCollectionId: Record<string, HttpTypes.StorePaymentCollection | undefined>,
  methodType: "card" | "promptpay",
  providerId?: string
): string[] {
  const secrets: string[] = []
  for (const slice of mp.slices) {
    const pc = byCollectionId[slice.payment_collection_id]
    const session = findStripeSessionForSlice(pc, methodType, providerId)
    const secret = session?.data?.client_secret as string | undefined
    if (secret) secrets.push(secret)
  }
  return secrets
}

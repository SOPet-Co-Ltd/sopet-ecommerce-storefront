"use client"

import { useCheckoutElementsSecret } from "@/components/sections/CheckoutPaymentSection/CheckoutElementsSecretContext"
import { useMarketplaceCheckout } from "@/components/sections/CheckoutPaymentSection/MarketplaceCheckoutContext"
import type { CheckoutPaymentMethod } from "@/components/sections/CheckoutPaymentSection/CheckoutPaymentContext"
import {
  createMarketplacePaymentSession,
  prepareMarketplacePayments,
} from "@/lib/data/cart"
import { getMarketplaceClientSecretsInOrder } from "@/lib/helpers/marketplace-checkout-ui"
import { isStripe } from "@/lib/constants"
import type { Cart } from "@/types/cart"
import type { MpCheckoutV1 } from "@/types/marketplace-checkout"
import type { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function pickCanonicalStripeProviderId(
  a?: string,
  b?: string
): string | undefined {
  if (!a) return b
  if (!b) return a
  if (a === b) return a
  if (a.includes("unified")) return a
  if (b.includes("unified")) return b
  return a
}

type UseMarketplaceStripePaymentInitArgs = {
  cart: Cart | null
  method: CheckoutPaymentMethod
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
}

export function useMarketplaceStripePaymentInit({
  cart,
  method,
  paymentMethods,
}: UseMarketplaceStripePaymentInitArgs) {
  const { setClientSecret, setMarketplacePaymentInitError } =
    useCheckoutElementsSecret()
  const {
    setMpCheckout,
    setSliceCollectionsById,
    mpRef,
    sliceMapRef,
    marketplaceInitKeyRef,
    lastBoundCartIdRef,
    resetMarketplaceSliceState,
  } = useMarketplaceCheckout()

  const [marketplaceInitializing, setMarketplaceInitializing] = useState(false)

  const paymentProvidersFingerprint = useMemo(
    () =>
      paymentMethods
        ? [...paymentMethods]
            .map((p) => p.id)
            .sort()
            .join("|")
        : "",
    [paymentMethods]
  )

  const shippingMethodsFingerprint = useMemo(
    () =>
      (cart?.shipping_methods ?? [])
        .map(
          (m) => `${m.id ?? ""}:${m.shipping_option_id ?? ""}:${m.amount ?? ""}`
        )
        .sort()
        .join("|"),
    [cart?.shipping_methods]
  )

  const {
    stripeProviderId,
    promptpayProviderId,
    unifiedStripeCheckout,
    dualPmSingleStripePrepare,
  } = useMemo(() => {
    const isStripeProv = (providerId?: string) =>
      providerId === "stripe" || isStripe(providerId)
    const isPromptpayProv = (providerId?: string) =>
      providerId?.toLowerCase().includes("promptpay") ?? false
    const unifiedId = paymentMethods?.find((p) => isStripeProv(p.id))?.id
    const stripeId =
      paymentMethods?.find((p) => isStripeProv(p.id) && !isPromptpayProv(p.id))
        ?.id || unifiedId
    const promptpayId =
      paymentMethods?.find((p) => isPromptpayProv(p.id))?.id || unifiedId

    const unified = Boolean(stripeId && promptpayId && stripeId === promptpayId)

    /** Separate Medusa provider rows for card vs PromptPay, both backed by Stripe — still one PI per slice if we create with both PM types. */
    const bothStripeLikeMedusaProviders = (a?: string, b?: string) => {
      if (!a || !b || a === b) return false
      const medusaStripeish = (id: string) =>
        id.startsWith("pp_") && /stripe/i.test(id)
      return medusaStripeish(a) && medusaStripeish(b)
    }

    const dualPmSingleStripePrepare = Boolean(
      stripeId &&
      promptpayId &&
      (unified || bothStripeLikeMedusaProviders(stripeId, promptpayId))
    )

    return {
      stripeProviderId: stripeId,
      promptpayProviderId: promptpayId,
      unifiedStripeCheckout: unified,
      dualPmSingleStripePrepare,
    }
  }, [paymentMethods])

  const marketplaceInitChainRef = useRef(Promise.resolve())
  const marketplaceAutoInitGenRef = useRef(0)

  const scheduleMarketplaceStripeInit = useCallback(
    <T>(task: () => Promise<T>) => {
      const run = marketplaceInitChainRef.current.then(() => task())
      marketplaceInitChainRef.current = run.then(
        () => undefined,
        () => undefined
      )
      return run
    },
    []
  )

  const performMarketplaceStripeInit = useCallback(
    async (opts: {
      methodType: "card" | "promptpay"
      withLoading?: boolean
      abortCommit?: () => boolean
    }): Promise<{
      mp: MpCheckoutV1
      byId: Record<string, HttpTypes.StorePaymentCollection>
    } | null> => {
      const c = cart
      if (!c?.id || !c.shipping_methods?.length) {
        return null
      }

      const resolvedProviderId = dualPmSingleStripePrepare
        ? pickCanonicalStripeProviderId(stripeProviderId, promptpayProviderId)
        : opts.methodType === "card"
          ? stripeProviderId
          : promptpayProviderId

      if (!resolvedProviderId) {
        return null
      }

      const cacheKey = dualPmSingleStripePrepare
        ? `${c.id}:stripe_dual_pm:${opts.methodType}:${resolvedProviderId}:${shippingMethodsFingerprint}:${paymentProvidersFingerprint}`
        : `${c.id}:${opts.methodType}:${resolvedProviderId}:${shippingMethodsFingerprint}:${paymentProvidersFingerprint}`

      const sliceMapComplete =
        Boolean(mpRef.current) &&
        (mpRef.current?.slices.length ?? 0) > 0 &&
        Object.keys(sliceMapRef.current).length >=
          (mpRef.current?.slices.length ?? 0)

      if (marketplaceInitKeyRef.current === cacheKey && sliceMapComplete) {
        const secrets = getMarketplaceClientSecretsInOrder(
          mpRef.current!,
          sliceMapRef.current,
          opts.methodType,
          resolvedProviderId
        )
        if (secrets[0]) {
          setClientSecret(secrets[0])
        }
        return {
          mp: mpRef.current!,
          byId: { ...sliceMapRef.current },
        }
      }

      if (opts.withLoading) {
        setMarketplaceInitializing(true)
        setMarketplacePaymentInitError(null)
      }

      try {
        if (opts.abortCommit?.()) {
          return null
        }
        const pmTypes: ("card" | "promptpay")[] = dualPmSingleStripePrepare
          ? ["card", "promptpay"]
          : [opts.methodType]
        const mp = await prepareMarketplacePayments(c.id)
        if (opts.abortCommit?.()) {
          return null
        }
        const next = Object.fromEntries(
          await Promise.all(
            mp.slices.map(async (slice) => {
              const collection = await createMarketplacePaymentSession(c.id, {
                payment_collection_id: slice.payment_collection_id,
                provider_id: resolvedProviderId,
                data: { payment_method_types: pmTypes },
              })
              return [slice.payment_collection_id, collection] as const
            })
          )
        )
        if (opts.abortCommit?.()) {
          return null
        }
        mpRef.current = mp
        sliceMapRef.current = next
        marketplaceInitKeyRef.current = cacheKey
        setMpCheckout(mp)
        setSliceCollectionsById(next)
        setMarketplacePaymentInitError(null)

        const secrets = getMarketplaceClientSecretsInOrder(
          mp,
          next,
          opts.methodType,
          resolvedProviderId
        )
        if (secrets[0]) {
          setClientSecret(secrets[0])
        }

        return { mp, byId: next }
      } catch (e) {
        if (opts.abortCommit?.()) {
          return null
        }
        const msg = (e as Error)?.message ?? "ไม่สามารถเตรียมการชำระเงินได้"
        setMarketplacePaymentInitError(msg)
        throw e
      } finally {
        if (opts.withLoading) {
          setMarketplaceInitializing(false)
        }
      }
    },
    [
      cart,
      dualPmSingleStripePrepare,
      stripeProviderId,
      promptpayProviderId,
      shippingMethodsFingerprint,
      paymentProvidersFingerprint,
      mpRef,
      sliceMapRef,
      marketplaceInitKeyRef,
      setMpCheckout,
      setSliceCollectionsById,
      setClientSecret,
      setMarketplacePaymentInitError,
    ]
  )

  useEffect(() => {
    const id = cart?.id
    if (!id) {
      lastBoundCartIdRef.current = null
      resetMarketplaceSliceState()
      return
    }
    if (lastBoundCartIdRef.current === id) {
      return
    }
    lastBoundCartIdRef.current = id
    resetMarketplaceSliceState()
    setMarketplacePaymentInitError(null)
  }, [
    cart?.id,
    lastBoundCartIdRef,
    resetMarketplaceSliceState,
    setMarketplacePaymentInitError,
  ])

  /**
   * Only pre-warm Stripe for card (Elements + saved PM). PromptPay sessions and the
   * payment countdown must start when the customer clicks "ชำระเงิน", not when they
   * select QR in the payment section (`runMarketplaceInitIfNeeded` on submit).
   */
  useEffect(() => {
    if (!cart?.id || !cart.shipping_methods?.length) return
    if (method !== "card") return

    const methodType = "card"
    const needsProvider = dualPmSingleStripePrepare
      ? Boolean(stripeProviderId && promptpayProviderId)
      : methodType === "card"
        ? stripeProviderId
        : promptpayProviderId
    if (!needsProvider) return

    marketplaceAutoInitGenRef.current += 1
    const gen = marketplaceAutoInitGenRef.current
    let cancelled = false
    const abortCommit = () =>
      cancelled || gen !== marketplaceAutoInitGenRef.current

    /** Debounce: each `prepare` replaces all slice payment collections server-side → extra Stripe PIs if this fires too often. */
    const debounceMs = 320
    const timer = window.setTimeout(() => {
      if (cancelled || gen !== marketplaceAutoInitGenRef.current) return
      scheduleMarketplaceStripeInit(async () => {
        if (cancelled) return
        try {
          await performMarketplaceStripeInit({
            methodType,
            withLoading: false,
            abortCommit,
          })
        } catch {
          // setMarketplacePaymentInitError handled inside performMarketplaceStripeInit
        }
      })
    }, debounceMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    cart?.id,
    cart?.shipping_methods?.length,
    method,
    paymentProvidersFingerprint,
    shippingMethodsFingerprint,
    dualPmSingleStripePrepare,
    stripeProviderId,
    promptpayProviderId,
    performMarketplaceStripeInit,
    scheduleMarketplaceStripeInit,
  ])

  const runMarketplaceInitIfNeeded = useCallback(
    async (
      methodType: "card" | "promptpay"
    ): Promise<{
      mp: MpCheckoutV1
      byId: Record<string, HttpTypes.StorePaymentCollection>
    }> => {
      const c = cart
      if (!c?.shipping_methods || c.shipping_methods.length === 0) {
        throw new Error("กรุณาเลือกวิธีจัดส่งก่อนชำระเงิน")
      }
      const needsProvider = dualPmSingleStripePrepare
        ? Boolean(stripeProviderId && promptpayProviderId)
        : methodType === "card"
          ? stripeProviderId
          : promptpayProviderId
      if (!needsProvider) {
        throw new Error("ไม่พบผู้ให้บริการชำระเงิน")
      }

      const out = await scheduleMarketplaceStripeInit(() =>
        performMarketplaceStripeInit({ methodType, withLoading: true })
      )
      if (!out) {
        throw new Error("ไม่พบผู้ให้บริการชำระเงิน")
      }
      return out
    },
    [
      cart,
      dualPmSingleStripePrepare,
      stripeProviderId,
      promptpayProviderId,
      scheduleMarketplaceStripeInit,
      performMarketplaceStripeInit,
    ]
  )

  const retryInit = useCallback(async () => {
    if (!cart?.id || !cart.shipping_methods?.length) return
    const methodType = method === "qrcode" ? "promptpay" : "card"
    const needsProvider = dualPmSingleStripePrepare
      ? Boolean(stripeProviderId && promptpayProviderId)
      : methodType === "card"
        ? stripeProviderId
        : promptpayProviderId
    if (!needsProvider) return
    try {
      await scheduleMarketplaceStripeInit(() =>
        performMarketplaceStripeInit({ methodType, withLoading: true })
      )
    } catch {
      // error state set in performMarketplaceStripeInit
    }
  }, [
    cart?.id,
    cart?.shipping_methods?.length,
    method,
    dualPmSingleStripePrepare,
    stripeProviderId,
    promptpayProviderId,
    scheduleMarketplaceStripeInit,
    performMarketplaceStripeInit,
  ])

  return {
    stripeProviderId,
    promptpayProviderId,
    unifiedStripeCheckout,
    dualPmSingleStripePrepare,
    marketplaceInitializing,
    scheduleMarketplaceStripeInit,
    performMarketplaceStripeInit,
    runMarketplaceInitIfNeeded,
    retryInit,
  }
}

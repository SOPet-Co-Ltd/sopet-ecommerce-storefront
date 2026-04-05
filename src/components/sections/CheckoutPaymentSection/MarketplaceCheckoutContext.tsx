"use client"

import type { MpCheckoutV1 } from "@/types/marketplace-checkout"
import type { HttpTypes } from "@medusajs/types"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

type MarketplaceCheckoutContextValue = {
  mpCheckout: MpCheckoutV1 | null
  setMpCheckout: (v: MpCheckoutV1 | null) => void
  sliceCollectionsById: Record<string, HttpTypes.StorePaymentCollection>
  setSliceCollectionsById: (
    v: Record<string, HttpTypes.StorePaymentCollection>
  ) => void
  mpRef: React.MutableRefObject<MpCheckoutV1 | null>
  sliceMapRef: React.MutableRefObject<
    Record<string, HttpTypes.StorePaymentCollection>
  >
  marketplaceInitKeyRef: React.MutableRefObject<string>
  /** Last cart id we reset marketplace state for; survives CheckoutSummary remounts (e.g. StripeWrapper key). */
  lastBoundCartIdRef: React.MutableRefObject<string | null>
  resetMarketplaceSliceState: () => void
}

const MarketplaceCheckoutContext =
  createContext<MarketplaceCheckoutContextValue | null>(null)

export function MarketplaceCheckoutProvider({
  children,
}: {
  children: ReactNode
}) {
  const [mpCheckout, setMpCheckout] = useState<MpCheckoutV1 | null>(null)
  const [sliceCollectionsById, setSliceCollectionsById] = useState<
    Record<string, HttpTypes.StorePaymentCollection>
  >({})

  const mpRef = useRef<MpCheckoutV1 | null>(null)
  const sliceMapRef = useRef<Record<string, HttpTypes.StorePaymentCollection>>(
    {}
  )
  const marketplaceInitKeyRef = useRef<string>("")
  const lastBoundCartIdRef = useRef<string | null>(null)

  const resetMarketplaceSliceState = useCallback(() => {
    mpRef.current = null
    sliceMapRef.current = {}
    marketplaceInitKeyRef.current = ""
    setMpCheckout(null)
    setSliceCollectionsById({})
  }, [])

  const value = useMemo(
    () => ({
      mpCheckout,
      setMpCheckout,
      sliceCollectionsById,
      setSliceCollectionsById,
      mpRef,
      sliceMapRef,
      marketplaceInitKeyRef,
      lastBoundCartIdRef,
      resetMarketplaceSliceState,
    }),
    [mpCheckout, sliceCollectionsById, resetMarketplaceSliceState]
  )

  return (
    <MarketplaceCheckoutContext.Provider value={value}>
      {children}
    </MarketplaceCheckoutContext.Provider>
  )
}

export function useMarketplaceCheckout() {
  const ctx = useContext(MarketplaceCheckoutContext)
  if (!ctx) {
    throw new Error(
      "useMarketplaceCheckout must be used within MarketplaceCheckoutProvider"
    )
  }
  return ctx
}

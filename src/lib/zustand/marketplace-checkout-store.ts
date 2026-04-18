import type { HttpTypes } from "@medusajs/types"
import { createStore } from "zustand/vanilla"

import type { MpCheckoutV1 } from "@/types/marketplace-checkout"

type MarketplaceCheckoutRefs = {
  mpRef: { current: MpCheckoutV1 | null }
  sliceMapRef: {
    current: Record<string, HttpTypes.StorePaymentCollection>
  }
  marketplaceInitKeyRef: { current: string }
  lastBoundCartFingerprintRef: { current: string | null }
}

type MarketplaceCheckoutState = {
  mpCheckout: MpCheckoutV1 | null
  sliceCollectionsById: Record<string, HttpTypes.StorePaymentCollection>
}

type MarketplaceCheckoutActions = MarketplaceCheckoutRefs & {
  setMpCheckout: (value: MpCheckoutV1 | null) => void
  setSliceCollectionsById: (
    value: Record<string, HttpTypes.StorePaymentCollection>
  ) => void
  resetMarketplaceSliceState: () => void
  resetStore: () => void
}

export type MarketplaceCheckoutStore = MarketplaceCheckoutState &
  MarketplaceCheckoutActions

const createRefs = (): MarketplaceCheckoutRefs => ({
  mpRef: { current: null },
  sliceMapRef: { current: {} },
  marketplaceInitKeyRef: { current: "" },
  lastBoundCartFingerprintRef: { current: null },
})

const getInitialState = (): MarketplaceCheckoutState => ({
  mpCheckout: null,
  sliceCollectionsById: {},
})

export function createMarketplaceCheckoutStore() {
  const refs = createRefs()

  return createStore<MarketplaceCheckoutStore>((set) => ({
    ...getInitialState(),
    ...refs,
    setMpCheckout: (mpCheckout) => {
      refs.mpRef.current = mpCheckout
      set({ mpCheckout })
    },
    setSliceCollectionsById: (sliceCollectionsById) => {
      refs.sliceMapRef.current = sliceCollectionsById
      set({ sliceCollectionsById })
    },
    resetMarketplaceSliceState: () => {
      refs.mpRef.current = null
      refs.sliceMapRef.current = {}
      refs.marketplaceInitKeyRef.current = ""
      set(getInitialState())
    },
    resetStore: () => {
      refs.lastBoundCartFingerprintRef.current = null
      refs.mpRef.current = null
      refs.sliceMapRef.current = {}
      refs.marketplaceInitKeyRef.current = ""
      set(getInitialState())
    },
  }))
}

export type MarketplaceCheckoutStoreApi = ReturnType<
  typeof createMarketplaceCheckoutStore
>

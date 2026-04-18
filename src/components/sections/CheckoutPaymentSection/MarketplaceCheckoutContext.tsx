"use client"

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import {
  createMarketplaceCheckoutStore,
  type MarketplaceCheckoutStore,
  type MarketplaceCheckoutStoreApi,
} from "@/lib/zustand/marketplace-checkout-store"

type MarketplaceCheckoutContextValue = MarketplaceCheckoutStore

const MarketplaceCheckoutStoreContext =
  createContext<MarketplaceCheckoutStoreApi | null>(null)

export function MarketplaceCheckoutProvider({
  children,
}: {
  children: ReactNode
}) {
  const storeRef = useRef<MarketplaceCheckoutStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = createMarketplaceCheckoutStore()
  }

  return (
    <MarketplaceCheckoutStoreContext.Provider value={storeRef.current}>
      {children}
    </MarketplaceCheckoutStoreContext.Provider>
  )
}

export function useMarketplaceCheckout(): MarketplaceCheckoutContextValue
export function useMarketplaceCheckout<T>(
  selector: (state: MarketplaceCheckoutContextValue) => T
): T
export function useMarketplaceCheckout<T>(
  selector?: (state: MarketplaceCheckoutContextValue) => T
): MarketplaceCheckoutContextValue | T {
  const store = useContext(MarketplaceCheckoutStoreContext)

  if (!store) {
    throw new Error(
      "useMarketplaceCheckout must be used within MarketplaceCheckoutProvider"
    )
  }

  if (selector) {
    return useStore(store, selector)
  }

  return useStore(store)
}

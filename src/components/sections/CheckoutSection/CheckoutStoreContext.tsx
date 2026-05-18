/**
 * React bridge for the checkout Zustand store.
 *
 * Wraps checkout page children so client components can read/update shared
 * checkout state without prop drilling. Vendor shipping is loaded per seller
 * via `useVendorShipping`.
 */
"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import {
  createCheckoutStore,
  type CheckoutStore,
  type CheckoutStoreApi,
  type CheckoutStoreInitialProps,
  type VendorShippingState,
} from "@/lib/zustand/checkout-store"

const CheckoutStoreContext = createContext<CheckoutStoreApi | null>(null)

// Default selector when hook is called without a slice function.
const identitySelector = (state: CheckoutStore): CheckoutStore => state

/** Mount once per checkout page; seeds store from server-fetched `initial` props. */
export function CheckoutStoreProvider({
  children,
  ...initial
}: CheckoutStoreInitialProps & { children: ReactNode }) {
  // Keep a stable store instance across re-renders (React Strict Mode safe).
  const storeRef = useRef<CheckoutStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = createCheckoutStore(initial)
  }

  return (
    <CheckoutStoreContext.Provider value={storeRef.current}>
      {children}
    </CheckoutStoreContext.Provider>
  )
}

/** Subscribe to the full store or a selected slice (Zustand `useStore`). */
export function useCheckoutStore(): CheckoutStore
export function useCheckoutStore<T>(selector: (state: CheckoutStore) => T): T
export function useCheckoutStore<T>(
  selector?: (state: CheckoutStore) => T
): CheckoutStore | T {
  const store = useContext(CheckoutStoreContext)

  if (!store) {
    throw new Error(
      "useCheckoutStore must be used within CheckoutStoreProvider"
    )
  }

  return useStore(
    store,
    (selector ?? identitySelector) as (
      state: CheckoutStore
    ) => CheckoutStore | T
  )
}

/**
 * ================================
 * 🔥 ADDED SAFE EXTENSION (NO BREAK CHANGE)
 * ================================
 *
 * Fix: allow correct access to selected paymentMethod
 * even if store currently only exposes paymentMethods
 */

export function useCheckoutPaymentMethod(): {
  paymentMethod: CheckoutStore["paymentMethods"] extends (infer T)[]
    ? T
    : string
  setPaymentMethod: (value: string) => void
} {
  return useCheckoutStore((state: any) => ({
    paymentMethod: state.paymentMethod ?? null,
    setPaymentMethod: state.setPaymentMethod,
  }))
}

/**
 * Loads and returns shipping options for one seller.
 * Starts fetch on mount; aborts stale loads on unmount or when ids change.
 */
export function useVendorShipping(
  cartId: string,
  sellerId: string
): VendorShippingState {
  const loadVendorShippingOptions = useCheckoutStore(
    (state) => state.loadVendorShippingOptions
  )
  const abortVendorShippingLoad = useCheckoutStore(
    (state) => state.abortVendorShippingLoad
  )
  const vendorShipping = useCheckoutStore(
    (state) => state.vendorShippingBySellerId[sellerId]
  )

  useEffect(() => {
    void loadVendorShippingOptions(cartId, sellerId)

    return () => {
      abortVendorShippingLoad(sellerId)
    }
  }, [abortVendorShippingLoad, cartId, loadVendorShippingOptions, sellerId])

  // Treat missing entry as loading until the store writes the first patch.
  return vendorShipping ?? { options: null, isLoading: true, error: null }
}

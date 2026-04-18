"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"
import { useStore } from "zustand"

import {
  createCheckoutPaymentStore,
  type CheckoutPaymentMethod,
  type CheckoutPaymentStore,
  type DraftShippingAddress,
  type CheckoutPaymentStoreApi,
} from "@/lib/zustand/checkout-payment-store"

export type { CheckoutPaymentMethod, DraftShippingAddress }

type CheckoutPaymentContextValue = CheckoutPaymentStore

const CheckoutPaymentStoreContext =
  createContext<CheckoutPaymentStoreApi | null>(null)

export function CheckoutPaymentProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CheckoutPaymentStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = createCheckoutPaymentStore()
  }

  return (
    <CheckoutPaymentStoreContext.Provider value={storeRef.current}>
      {children}
    </CheckoutPaymentStoreContext.Provider>
  )
}

export function useCheckoutPayment(): CheckoutPaymentContextValue
export function useCheckoutPayment<T>(
  selector: (state: CheckoutPaymentContextValue) => T
): T
export function useCheckoutPayment<T>(
  selector?: (state: CheckoutPaymentContextValue) => T
): CheckoutPaymentContextValue | T {
  const store = useContext(CheckoutPaymentStoreContext)

  if (!store) {
    throw new Error(
      "useCheckoutPayment must be used within CheckoutPaymentProvider"
    )
  }

  if (selector) {
    return useStore(store, selector)
  }

  return useStore(store)
}

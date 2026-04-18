"use client"

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from "react"
import { useStore } from "zustand"

import {
  createCheckoutElementsSecretStore,
  type CheckoutElementsSecretStore,
  type CheckoutElementsSecretStoreApi,
} from "@/lib/zustand/checkout-elements-secret-store"

type CheckoutElementsSecretContextValue = CheckoutElementsSecretStore

const CheckoutElementsSecretStoreContext =
  createContext<CheckoutElementsSecretStoreApi | null>(null)

export function CheckoutElementsSecretProvider({
  children,
}: {
  children: ReactNode
}) {
  const storeRef = useRef<CheckoutElementsSecretStoreApi | null>(null)

  if (!storeRef.current) {
    storeRef.current = createCheckoutElementsSecretStore()
  }

  return (
    <CheckoutElementsSecretStoreContext.Provider value={storeRef.current}>
      {children}
    </CheckoutElementsSecretStoreContext.Provider>
  )
}

export function useCheckoutElementsSecret(): CheckoutElementsSecretContextValue
export function useCheckoutElementsSecret<T>(
  selector: (state: CheckoutElementsSecretContextValue) => T
): T
export function useCheckoutElementsSecret<T>(
  selector?: (state: CheckoutElementsSecretContextValue) => T
): CheckoutElementsSecretContextValue | T {
  const store = useContext(CheckoutElementsSecretStoreContext)

  if (!store) {
    throw new Error(
      "useCheckoutElementsSecret must be used within CheckoutElementsSecretProvider"
    )
  }

  if (selector) {
    return useStore(store, selector)
  }

  return useStore(store)
}

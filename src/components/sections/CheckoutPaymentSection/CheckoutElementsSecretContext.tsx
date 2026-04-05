"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type CheckoutElementsSecretContextValue = {
  /** Client secret for the active Stripe Elements instance (first slice / primary PI). */
  clientSecret: string | undefined
  setClientSecret: (secret: string | undefined) => void
  /** Bump to force remount Elements when switching primary PI. */
  elementsKey: number
  bumpElementsKey: () => void
  /** Last marketplace prepare/session failure (shared for payment section copy). */
  marketplacePaymentInitError: string | null
  setMarketplacePaymentInitError: (message: string | null) => void
}

const CheckoutElementsSecretContext =
  createContext<CheckoutElementsSecretContextValue | null>(null)

export function CheckoutElementsSecretProvider({
  children,
}: {
  children: ReactNode
}) {
  const [clientSecret, setClientSecret] = useState<string | undefined>()
  const [elementsKey, setElementsKey] = useState(0)
  const [marketplacePaymentInitError, setMarketplacePaymentInitError] =
    useState<string | null>(null)

  const bumpElementsKey = useCallback(() => {
    setElementsKey((k) => k + 1)
  }, [])

  const value = useMemo(
    () => ({
      clientSecret,
      setClientSecret,
      elementsKey,
      bumpElementsKey,
      marketplacePaymentInitError,
      setMarketplacePaymentInitError,
    }),
    [clientSecret, elementsKey, bumpElementsKey, marketplacePaymentInitError]
  )

  return (
    <CheckoutElementsSecretContext.Provider value={value}>
      {children}
    </CheckoutElementsSecretContext.Provider>
  )
}

export function useCheckoutElementsSecret() {
  const ctx = useContext(CheckoutElementsSecretContext)
  if (!ctx) {
    throw new Error(
      "useCheckoutElementsSecret must be used within CheckoutElementsSecretProvider"
    )
  }
  return ctx
}

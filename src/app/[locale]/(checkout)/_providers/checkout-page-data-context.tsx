"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { HttpTypes } from "@medusajs/types"
import {
  getCustomerPaymentMethods,
  verifyCustomer,
  type CustomerPaymentMethod,
} from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import type { StoreCardShippingMethod } from "@/types/cart"

export type CheckoutPageDataContextValue = {
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  /** Saved cards from Stripe (store API); empty for guests or on failure. */
  savedStripePaymentMethods: CustomerPaymentMethod[]
  /** First load (blocks checkout sections that need this data). */
  isLoading: boolean
  /** Background refresh (e.g. after OTP merge) without full skeleton. */
  isRefreshing: boolean
  error: string | null
  refetch: () => Promise<void>
  refetchSavedStripePaymentMethods: () => Promise<void>
}

const CheckoutPageDataContext =
  createContext<CheckoutPageDataContextValue | null>(null)

type CheckoutPageDataProviderProps = {
  cartId: string
  regionId: string | null | undefined
  children: ReactNode
}

async function fetchCheckoutBundle(
  cartId: string,
  regionId: string | null | undefined
): Promise<{
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  savedStripePaymentMethods: CustomerPaymentMethod[]
  bundleError: string | null
}> {
  const settled = await Promise.allSettled([
    listCartShippingMethods(cartId, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    verifyCustomer(),
    getCustomerPaymentMethods(),
  ])

  const [shippingRes, providersRes, customerRes, pmRes] = settled

  const shippingMethods =
    shippingRes.status === "fulfilled" ? (shippingRes.value ?? []) : []
  const paymentMethods =
    providersRes.status === "fulfilled" ? providersRes.value : null
  const customer = customerRes.status === "fulfilled" ? customerRes.value : null
  const savedStripePaymentMethods =
    pmRes.status === "fulfilled" && pmRes.value.success
      ? pmRes.value.paymentMethods
      : []

  let bundleError: string | null = null
  if (shippingRes.status === "rejected") {
    bundleError =
      (shippingRes.reason as Error)?.message ??
      "ไม่สามารถโหลดตัวเลือกการจัดส่งได้"
  } else if (customerRes.status === "rejected") {
    bundleError =
      (customerRes.reason as Error)?.message ?? "ไม่สามารถโหลดข้อมูลบัญชีได้"
  }

  return {
    shippingMethods,
    paymentMethods,
    customer,
    savedStripePaymentMethods,
    bundleError,
  }
}

export function CheckoutPageDataProvider({
  cartId,
  regionId,
  children,
}: CheckoutPageDataProviderProps) {
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [shippingMethods, setShippingMethods] = useState<
    StoreCardShippingMethod[]
  >([])
  const [paymentMethods, setPaymentMethods] = useState<
    HttpTypes.StorePaymentProvider[] | null
  >(null)
  const [savedStripePaymentMethods, setSavedStripePaymentMethods] = useState<
    CustomerPaymentMethod[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (mode: "initial" | "refetch") => {
      if (mode === "initial") {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      setError(null)
      try {
        const data = await fetchCheckoutBundle(cartId, regionId)
        setShippingMethods(data.shippingMethods)
        setPaymentMethods(data.paymentMethods)
        setCustomer(data.customer)
        setSavedStripePaymentMethods(data.savedStripePaymentMethods)
        setError(data.bundleError)
      } catch (e) {
        setError((e as Error)?.message ?? "ไม่สามารถโหลดข้อมูล checkout ได้")
      } finally {
        if (mode === "initial") {
          setIsLoading(false)
        } else {
          setIsRefreshing(false)
        }
      }
    },
    [cartId, regionId]
  )

  useEffect(() => {
    void load("initial")
  }, [load])

  const refetch = useCallback(async () => {
    await load("refetch")
  }, [load])

  const refetchSavedStripePaymentMethods = useCallback(async () => {
    const pmRes = await getCustomerPaymentMethods()
    if (pmRes.success) {
      setSavedStripePaymentMethods(pmRes.paymentMethods)
    } else {
      setSavedStripePaymentMethods([])
    }
  }, [])

  const value = useMemo(
    () => ({
      customer,
      shippingMethods,
      paymentMethods,
      savedStripePaymentMethods,
      isLoading,
      isRefreshing,
      error,
      refetch,
      refetchSavedStripePaymentMethods,
    }),
    [
      customer,
      shippingMethods,
      paymentMethods,
      savedStripePaymentMethods,
      isLoading,
      isRefreshing,
      error,
      refetch,
      refetchSavedStripePaymentMethods,
    ]
  )

  return (
    <CheckoutPageDataContext.Provider value={value}>
      {children}
    </CheckoutPageDataContext.Provider>
  )
}

export function useCheckoutPageData(): CheckoutPageDataContextValue {
  const ctx = useContext(CheckoutPageDataContext)
  if (!ctx) {
    throw new Error(
      "useCheckoutPageData must be used within CheckoutPageDataProvider"
    )
  }
  return ctx
}

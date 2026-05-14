"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { HttpTypes } from "@medusajs/types"
import { getCheckoutCustomer } from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import type { StoreCardShippingMethod } from "@/types/cart"
import type { CheckoutPageInitialData } from "@/lib/data/checkout-page"

export type CheckoutPageDataContextValue = {
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CheckoutPageDataContext =
  createContext<CheckoutPageDataContextValue | null>(null)

type CheckoutPageDataProviderProps = {
  cartId: string
  regionId: string | null | undefined
  initialData?: CheckoutPageInitialData | null
  children: ReactNode
}

async function fetchCheckoutBundle(
  cartId: string,
  regionId: string | null | undefined
): Promise<{
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  bundleError: string | null
}> {
  const settled = await Promise.allSettled([
    listCartShippingMethods(cartId, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    getCheckoutCustomer(),
  ])

  const [shippingRes, providersRes, customerRes] = settled

  const shippingMethods =
    shippingRes.status === "fulfilled" ? (shippingRes.value ?? []) : []
  const paymentMethods =
    providersRes.status === "fulfilled" ? providersRes.value : null
  const customer = customerRes.status === "fulfilled" ? customerRes.value : null

  let bundleError: string | null = null
  if (shippingRes.status === "rejected") {
    bundleError =
      (shippingRes.reason as Error)?.message ??
      "ไม่สามารถโหลดตัวเลือกการจัดส่งได้"
  } else if (customerRes.status === "rejected") {
    bundleError =
      (customerRes.reason as Error)?.message ?? "ไม่สามารถโหลดข้อมูลบัญชีได้"
  }

  return { shippingMethods, paymentMethods, customer, bundleError }
}

export function CheckoutPageDataProvider({
  cartId,
  regionId,
  initialData,
  children,
}: CheckoutPageDataProviderProps) {
  const hasInitialData = Boolean(initialData)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(
    initialData?.customer ?? null
  )
  const [shippingMethods, setShippingMethods] = useState<
    StoreCardShippingMethod[]
  >(initialData?.shippingMethods ?? [])
  const [paymentMethods, setPaymentMethods] = useState<
    HttpTypes.StorePaymentProvider[] | null
  >(initialData?.paymentMethods ?? null)
  const [isLoading, setIsLoading] = useState(!hasInitialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(initialData?.error ?? null)
  const bootstrappedRef = useRef(hasInitialData)

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
    if (bootstrappedRef.current) {
      bootstrappedRef.current = false
      return
    }
    void load("initial")
  }, [load])

  useEffect(() => {
    if (!initialData) return
    setShippingMethods(initialData.shippingMethods)
    setPaymentMethods(initialData.paymentMethods)
    setCustomer(initialData.customer)
    setError(initialData.error)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [initialData, cartId, regionId])

  const refetch = useCallback(async () => {
    await load("refetch")
  }, [load])

  const value = useMemo(
    () => ({
      customer,
      shippingMethods,
      paymentMethods,
      isLoading,
      isRefreshing,
      error,
      refetch,
    }),
    [
      customer,
      shippingMethods,
      paymentMethods,
      isLoading,
      isRefreshing,
      error,
      refetch,
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

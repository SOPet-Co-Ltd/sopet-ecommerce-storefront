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
import {
  getCheckoutCustomer,
  getCustomerPaymentMethods,
  type CustomerPaymentMethod,
} from "@/lib/data/customer"
import { listCartShippingMethods } from "@/lib/data/fulfillment"
import { listCartPaymentMethods } from "@/lib/data/payment"
import type { StoreCardShippingMethod } from "@/types/cart"
import type { CheckoutPageInitialData } from "@/lib/data/checkout-page"

export type CheckoutPageDataContextValue = {
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  /** Saved cards from Stripe (store API); empty for guests or on failure. */
  savedStripePaymentMethods: CustomerPaymentMethod[]
  upsertSavedStripePaymentMethod: (paymentMethod: CustomerPaymentMethod) => void
  isSavedStripePaymentMethodsLoading: boolean
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
  const checkoutPerfClient =
    process.env.NODE_ENV === "development" ||
    process.env["NEXT_PUBLIC_CHECKOUT_PERF_LOG"] === "1"

  const bundleT0 =
    checkoutPerfClient && typeof performance !== "undefined"
      ? performance.now()
      : null

  const settled = await Promise.allSettled([
    listCartShippingMethods(cartId, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    getCheckoutCustomer(),
  ])

  if (bundleT0 !== null && typeof performance !== "undefined") {
    console.info(
      "[checkout-perf] bundle",
      `${(performance.now() - bundleT0).toFixed(1)}ms`
    )
  }

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

  return {
    shippingMethods,
    paymentMethods,
    customer,
    bundleError,
  }
}

const SAVED_PAYMENT_METHODS_TIMEOUT_MS = 8000

async function fetchSavedStripePaymentMethodsWithTimeout(): Promise<
  CustomerPaymentMethod[] | null
> {
  try {
    const result = await Promise.race([
      getCustomerPaymentMethods().then((response) =>
        response.success ? response.paymentMethods : null
      ),
      new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), SAVED_PAYMENT_METHODS_TIMEOUT_MS)
      ),
    ])

    return result
  } catch {
    return null
  }
}

export function CheckoutPageDataProvider({
  cartId,
  regionId,
  initialData,
  children,
}: CheckoutPageDataProviderProps) {
  const hasInitialData = Boolean(initialData)
  const hasInitialSavedStripePaymentMethods =
    initialData?.savedStripePaymentMethodsLoaded ?? false
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(
    initialData?.customer ?? null
  )
  const [shippingMethods, setShippingMethods] = useState<
    StoreCardShippingMethod[]
  >(initialData?.shippingMethods ?? [])
  const [paymentMethods, setPaymentMethods] = useState<
    HttpTypes.StorePaymentProvider[] | null
  >(initialData?.paymentMethods ?? null)
  const [savedStripePaymentMethods, setSavedStripePaymentMethods] = useState<
    CustomerPaymentMethod[]
  >(initialData?.savedStripePaymentMethods ?? [])
  const [
    isSavedStripePaymentMethodsLoading,
    setIsSavedStripePaymentMethodsLoading,
  ] = useState(
    Boolean(initialData?.customer?.id) && !hasInitialSavedStripePaymentMethods
  )
  const [isLoading, setIsLoading] = useState(!hasInitialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(initialData?.error ?? null)
  const bootstrappedRef = useRef(hasInitialData)
  const savedPaymentMethodsLoadedForCustomerRef = useRef<string | null>(
    initialData?.customer?.id && hasInitialSavedStripePaymentMethods
      ? initialData.customer.id
      : null
  )
  const savedPaymentMethodsFetchingForCustomerRef = useRef<string | null>(null)

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

    const nextCustomerId = initialData.customer?.id ?? null
    const currentCustomerId = customer?.id ?? null

    setShippingMethods(initialData.shippingMethods)
    setPaymentMethods(initialData.paymentMethods)
    setCustomer(initialData.customer)
    if (!nextCustomerId) {
      setSavedStripePaymentMethods([])
      savedPaymentMethodsLoadedForCustomerRef.current = null
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setIsSavedStripePaymentMethodsLoading(false)
    } else if (initialData.savedStripePaymentMethodsLoaded) {
      setSavedStripePaymentMethods(initialData.savedStripePaymentMethods)
      savedPaymentMethodsLoadedForCustomerRef.current = nextCustomerId
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setIsSavedStripePaymentMethodsLoading(false)
    } else if (currentCustomerId !== nextCustomerId) {
      setSavedStripePaymentMethods([])
      savedPaymentMethodsLoadedForCustomerRef.current = null
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setIsSavedStripePaymentMethodsLoading(true)
    } else if (
      savedPaymentMethodsLoadedForCustomerRef.current !== nextCustomerId
    ) {
      setIsSavedStripePaymentMethodsLoading(true)
    } else {
      setIsSavedStripePaymentMethodsLoading(false)
    }
    setError(initialData.error)
    setIsLoading(false)
    setIsRefreshing(false)
  }, [initialData, cartId, regionId, customer?.id])

  const refetch = useCallback(async () => {
    await load("refetch")
  }, [load])

  const refetchSavedStripePaymentMethods = useCallback(async () => {
    if (!customer?.id) {
      setSavedStripePaymentMethods([])
      savedPaymentMethodsLoadedForCustomerRef.current = null
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setIsSavedStripePaymentMethodsLoading(false)
      return
    }
    savedPaymentMethodsFetchingForCustomerRef.current = customer.id
    setIsSavedStripePaymentMethodsLoading(true)
    try {
      const paymentMethods = await fetchSavedStripePaymentMethodsWithTimeout()
      if (paymentMethods) {
        setSavedStripePaymentMethods(paymentMethods)
      }
    } finally {
      savedPaymentMethodsLoadedForCustomerRef.current = customer.id
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setIsSavedStripePaymentMethodsLoading(false)
    }
  }, [customer?.id])

  const upsertSavedStripePaymentMethod = useCallback(
    (paymentMethod: CustomerPaymentMethod) => {
      if (customer?.id) {
        savedPaymentMethodsLoadedForCustomerRef.current = customer.id
        savedPaymentMethodsFetchingForCustomerRef.current = null
      }
      setSavedStripePaymentMethods((prev) => {
        const next = [
          paymentMethod,
          ...prev.filter((pm) => pm.id !== paymentMethod.id),
        ]
        if (paymentMethod.is_default) {
          return next.map((pm) =>
            pm.id === paymentMethod.id
              ? paymentMethod
              : { ...pm, is_default: false }
          )
        }
        return next
      })
    },
    [customer?.id]
  )

  useEffect(() => {
    const customerId = customer?.id ?? null

    if (!customerId) {
      savedPaymentMethodsLoadedForCustomerRef.current = null
      savedPaymentMethodsFetchingForCustomerRef.current = null
      setSavedStripePaymentMethods([])
      setIsSavedStripePaymentMethodsLoading(false)
      return
    }

    if (savedPaymentMethodsLoadedForCustomerRef.current === customerId) {
      setIsSavedStripePaymentMethodsLoading(false)
      return
    }

    if (savedPaymentMethodsFetchingForCustomerRef.current === customerId) {
      setIsSavedStripePaymentMethodsLoading(true)
      return
    }

    savedPaymentMethodsFetchingForCustomerRef.current = customerId
    setIsSavedStripePaymentMethodsLoading(true)

    let cancelled = false
    void fetchSavedStripePaymentMethodsWithTimeout()
      .then((paymentMethods) => {
        if (cancelled) return
        if (paymentMethods) {
          setSavedStripePaymentMethods(paymentMethods)
        }
      })
      .finally(() => {
        if (!cancelled) {
          savedPaymentMethodsLoadedForCustomerRef.current = customerId
          savedPaymentMethodsFetchingForCustomerRef.current = null
          setIsSavedStripePaymentMethodsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [customer?.id])

  const value = useMemo(
    () => ({
      customer,
      shippingMethods,
      paymentMethods,
      savedStripePaymentMethods,
      upsertSavedStripePaymentMethod,
      isSavedStripePaymentMethodsLoading,
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
      upsertSavedStripePaymentMethod,
      isSavedStripePaymentMethodsLoading,
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

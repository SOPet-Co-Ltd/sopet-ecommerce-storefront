"use client"

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { HttpTypes } from "@medusajs/types"

import type {
  CheckoutPageBundleData,
  CheckoutPageInitialData,
} from "@/lib/data/checkout-page"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { queryKeys } from "@/lib/react-query/query-keys"
import type { StoreCardShippingMethod } from "@/types/cart"

export type CheckoutPageDataContextValue = {
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  savedStripePaymentMethods: CustomerPaymentMethod[]
  upsertSavedStripePaymentMethod: (paymentMethod: CustomerPaymentMethod) => void
  isSavedStripePaymentMethodsLoading: boolean
  isLoading: boolean
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

type SavedPaymentMethodsResponse = {
  paymentMethods?: CustomerPaymentMethod[]
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchCheckoutBundle(
  cartId: string,
  regionId: string | null | undefined
): Promise<CheckoutPageBundleData> {
  const params = new URLSearchParams({
    cartId,
  })

  if (regionId) {
    params.set("regionId", regionId)
  }

  const response = await fetch(`/api/checkout/page-data?${params.toString()}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดข้อมูล checkout ได้")
  }

  return parseJson<CheckoutPageBundleData>(response)
}

async function fetchSavedStripePaymentMethods(): Promise<
  CustomerPaymentMethod[]
> {
  const response = await fetch("/api/checkout/saved-payment-methods", {
    cache: "no-store",
  })

  if (response.status === 401) {
    return []
  }

  if (!response.ok) {
    return []
  }

  const payload = await parseJson<SavedPaymentMethodsResponse>(response)
  return payload.paymentMethods ?? []
}

export function CheckoutPageDataProvider({
  cartId,
  regionId,
  initialData,
  children,
}: CheckoutPageDataProviderProps) {
  const queryClient = useQueryClient()
  const bundleQueryKey = useMemo(
    () => queryKeys.checkout.pageData(cartId, regionId),
    [cartId, regionId]
  )
  const initialBundleData = useMemo<CheckoutPageBundleData | undefined>(() => {
    if (!initialData) {
      return undefined
    }

    return {
      customer: initialData.customer,
      shippingMethods: initialData.shippingMethods,
      paymentMethods: initialData.paymentMethods,
      error: initialData.error,
    }
  }, [initialData])

  const bundleQuery = useQuery({
    queryKey: bundleQueryKey,
    queryFn: () => fetchCheckoutBundle(cartId, regionId),
    initialData: initialBundleData,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!initialBundleData) {
      return
    }

    queryClient.setQueryData(bundleQueryKey, initialBundleData)
  }, [bundleQueryKey, initialBundleData, queryClient])

  const customerId = bundleQuery.data?.customer?.id ?? null
  const savedPaymentMethodsQueryKey = useMemo(
    () => queryKeys.checkout.savedPaymentMethods(customerId),
    [customerId]
  )

  const savedPaymentMethodsQuery = useQuery({
    queryKey: savedPaymentMethodsQueryKey,
    queryFn: fetchSavedStripePaymentMethods,
    enabled: Boolean(customerId),
    initialData:
      customerId && initialData?.savedStripePaymentMethodsLoaded
        ? initialData.savedStripePaymentMethods
        : undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!customerId || !initialData?.savedStripePaymentMethodsLoaded) {
      return
    }

    queryClient.setQueryData(
      savedPaymentMethodsQueryKey,
      initialData.savedStripePaymentMethods
    )
  }, [
    customerId,
    initialData?.savedStripePaymentMethods,
    initialData?.savedStripePaymentMethodsLoaded,
    queryClient,
    savedPaymentMethodsQueryKey,
  ])

  const upsertSavedStripePaymentMethod = useCallback(
    (paymentMethod: CustomerPaymentMethod) => {
      if (!customerId) {
        return
      }

      queryClient.setQueryData<CustomerPaymentMethod[]>(
        savedPaymentMethodsQueryKey,
        (current = []) => {
          const next = [
            paymentMethod,
            ...current.filter((candidate) => candidate.id !== paymentMethod.id),
          ]

          if (!paymentMethod.is_default) {
            return next
          }

          return next.map((candidate) =>
            candidate.id === paymentMethod.id
              ? paymentMethod
              : { ...candidate, is_default: false }
          )
        }
      )
    },
    [customerId, queryClient, savedPaymentMethodsQueryKey]
  )

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: bundleQueryKey,
      type: "active",
    })
  }, [bundleQueryKey, queryClient])

  const refetchSavedStripePaymentMethods = useCallback(async () => {
    if (!customerId) {
      return
    }

    await queryClient.refetchQueries({
      queryKey: savedPaymentMethodsQueryKey,
      type: "active",
    })
  }, [customerId, queryClient, savedPaymentMethodsQueryKey])

  const value = useMemo<CheckoutPageDataContextValue>(
    () => ({
      customer: bundleQuery.data?.customer ?? null,
      shippingMethods: bundleQuery.data?.shippingMethods ?? [],
      paymentMethods: bundleQuery.data?.paymentMethods ?? null,
      savedStripePaymentMethods: customerId
        ? savedPaymentMethodsQuery.data ?? []
        : [],
      upsertSavedStripePaymentMethod,
      isSavedStripePaymentMethodsLoading:
        Boolean(customerId) &&
        savedPaymentMethodsQuery.isPending &&
        savedPaymentMethodsQuery.data === undefined,
      isLoading: bundleQuery.isPending,
      isRefreshing: bundleQuery.isFetching && !bundleQuery.isPending,
      error:
        bundleQuery.data?.error ??
        (bundleQuery.error instanceof Error ? bundleQuery.error.message : null),
      refetch,
      refetchSavedStripePaymentMethods,
    }),
    [
      bundleQuery.data,
      bundleQuery.error,
      bundleQuery.isFetching,
      bundleQuery.isPending,
      customerId,
      refetch,
      refetchSavedStripePaymentMethods,
      savedPaymentMethodsQuery.data,
      savedPaymentMethodsQuery.isPending,
      upsertSavedStripePaymentMethod,
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

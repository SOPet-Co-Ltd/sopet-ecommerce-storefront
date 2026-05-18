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
  CouponData,
} from "@/lib/data/checkout-page"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { queryKeys } from "@/lib/react-query/query-keys"
import type { StoreCardShippingMethod } from "@/types/cart"

export type CheckoutPageDataContextValue = {
  customer: HttpTypes.StoreCustomer | null
  customerAddresses: HttpTypes.StoreCustomerAddress[]
  customerCards: CustomerPaymentMethod[]
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  sitePromos: CouponData[]
  vendorPromos: CouponData[]
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
  const params = new URLSearchParams({ cartId })
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
      customerAddresses: initialData.customerAddresses ?? [],
      customerCards: initialData.customerCards ?? [],
      sitePromos: initialData.sitePromos ?? [],
      vendorPromos: initialData.vendorPromos ?? [],
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

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: bundleQueryKey,
      type: "active",
    })
  }, [bundleQueryKey, queryClient])

  const value = useMemo<CheckoutPageDataContextValue>(
    () => ({
      customer: bundleQuery.data?.customer ?? null,
      customerAddresses: bundleQuery.data?.customerAddresses ?? [],
      customerCards: bundleQuery.data?.customerCards ?? [],
      shippingMethods: bundleQuery.data?.shippingMethods ?? [],
      paymentMethods: bundleQuery.data?.paymentMethods ?? null,
      sitePromos: bundleQuery.data?.sitePromos ?? [],
      vendorPromos: bundleQuery.data?.vendorPromos ?? [],
      isLoading: bundleQuery.isPending,
      isRefreshing: bundleQuery.isFetching && !bundleQuery.isPending,
      error:
        bundleQuery.data?.error ??
        (bundleQuery.error instanceof Error ? bundleQuery.error.message : null),
      refetch,
    }),
    [
      bundleQuery.data,
      bundleQuery.error,
      bundleQuery.isFetching,
      bundleQuery.isPending,
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

"use client"

import { useQuery } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/config"
import { queryKeys } from "@/lib/react-query"
import { SellerProps } from "@/types/seller"

type ProductWithSeller = HttpTypes.StoreProduct & {
  seller?: SellerProps
}

const fetchProduct = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}): Promise<ProductWithSeller | null> => {
  const { products } = await sdk.client.fetch<{
    products: ProductWithSeller[]
  }>(`/store/products`, {
    method: "GET",
    query: {
      handle: [handle],
      limit: 1,
      country_code: locale,
    },
  })

  return products?.[0] ?? null
}

type UseProductQueryArgs = {
  handle: string
  locale: string
  initialData?: ProductWithSeller | null
}

export const useProductQuery = ({
  handle,
  locale,
  initialData,
}: UseProductQueryArgs) => {
  const hasQueryParams = Boolean(handle && locale)
  const queryKey = queryKeys.products.byHandle(locale, handle)
  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProduct({ handle, locale }),
    enabled: hasQueryParams,
    initialData,
    refetchOnWindowFocus: false,
  })

  return {
    product: data ?? null,
    isLoading,
    isError: !!error,
    error,
  }
}

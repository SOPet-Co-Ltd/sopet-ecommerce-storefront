"use client"

import useSWR from "swr"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/config"
import {
  makeProductCacheKey,
  useProductCache,
} from "@/components/providers/ProductCacheProvider"
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
  const { getProduct, setProduct } = useProductCache()
  const cacheKey = makeProductCacheKey(locale, handle)

  const cached = getProduct(cacheKey) ?? undefined

  const swrKey = handle && locale ? ["product", locale, handle] : null

  const { data, error, isLoading } = useSWR<ProductWithSeller | null>(
    swrKey,
    () => fetchProduct({ handle, locale }),
    {
      fallbackData: cached ?? initialData ?? null,
      revalidateOnFocus: false,
    }
  )

  if (data && !cached) {
    setProduct(cacheKey, data)
  }

  return {
    product: data,
    isLoading,
    isError: !!error,
    error,
  }
}

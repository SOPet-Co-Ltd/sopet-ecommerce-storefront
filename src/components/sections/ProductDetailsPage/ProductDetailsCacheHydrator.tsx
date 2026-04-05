"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import {
  makeProductCacheKey,
  useProductCache,
} from "@/components/providers/ProductCacheProvider"
import { SellerProps } from "@/types/seller"

type ProductWithSeller = HttpTypes.StoreProduct & {
  seller?: SellerProps
}

type ProductDetailsCacheHydratorProps = {
  product: ProductWithSeller
  locale: string
}

export const ProductDetailsCacheHydrator = ({
  product,
  locale,
}: ProductDetailsCacheHydratorProps) => {
  const { setProduct } = useProductCache()

  // RSC passes a new `product` object reference on every payload; depending on it
  // re-runs this effect and updates the global cache → broad client re-renders.
  const cacheVersion = `${product.id}:${product.updated_at ?? ""}`

  useEffect(() => {
    if (!product?.handle) return

    const key = makeProductCacheKey(locale, product.handle)
    setProduct(key, product)
    // Intentionally omit `product` from deps: RSC often sends a new object reference
    // per payload; `cacheVersion` gates real data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, product.handle, cacheVersion, setProduct])

  return null
}

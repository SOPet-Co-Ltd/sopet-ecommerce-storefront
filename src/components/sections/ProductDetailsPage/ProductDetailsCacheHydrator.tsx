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

  useEffect(() => {
    if (!product?.handle) return

    const key = makeProductCacheKey(locale, product.handle)
    setProduct(key, product)
  }, [locale, product, setProduct])

  return null
}

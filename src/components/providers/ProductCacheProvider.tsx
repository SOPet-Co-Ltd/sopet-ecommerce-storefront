"use client"

import { HttpTypes } from "@medusajs/types"
import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type Product = HttpTypes.StoreProduct

type ProductCacheContextValue = {
  getProduct: (key: string) => Product | undefined
  setProduct: (key: string, product: Product) => void
}

const ProductCacheContext = createContext<ProductCacheContextValue | undefined>(
  undefined
)

export const ProductCacheProvider = ({ children }: PropsWithChildren) => {
  const [cache, setCache] = useState<Record<string, Product>>({})

  const getProduct = useCallback(
    (key: string) => {
      return cache[key]
    },
    [cache]
  )

  const setProduct = useCallback((key: string, product: Product) => {
    setCache((prev) => {
      if (prev[key] === product) {
        return prev
      }

      return {
        ...prev,
        [key]: product,
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      getProduct,
      setProduct,
    }),
    [getProduct, setProduct]
  )

  return (
    <ProductCacheContext.Provider value={value}>
      {children}
    </ProductCacheContext.Provider>
  )
}

export const useProductCache = () => {
  const ctx = useContext(ProductCacheContext)

  if (!ctx) {
    throw new Error("useProductCache must be used within ProductCacheProvider")
  }

  return ctx
}

export const makeProductCacheKey = (locale: string, handle: string) =>
  `${locale}::${handle}`

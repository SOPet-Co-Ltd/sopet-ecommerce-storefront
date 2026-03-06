"use server"

import { SellerProps } from "@/types/seller"
import { sdk } from "../config"
import medusaError from "../helpers/medusa-error"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import type { HttpTypes } from "@medusajs/types"

interface RecentOrdersResponse {
  orders: Array<
    HttpTypes.StoreOrder & {
      seller?: SellerProps
      reviews?: any[]
      items?: Array<{
        id: string
        product?: HttpTypes.StoreProduct & { seller?: SellerProps }
        variant?: HttpTypes.StoreProductVariant
        metadata?: Record<string, unknown>
      }>
    }
  >
  count: number
  limit: number
}

/**
 * Fetches recent orders for the logged-in customer and extracts unique products
 * from the order items. Returns null if customer is not authenticated or has no orders.
 */
export const getRecentOrderProducts = async (): Promise<Array<
  HttpTypes.StoreProduct & { seller?: SellerProps }
> | null> => {
  try {
    const headers = await getAuthHeaders()

    // If no auth headers, customer is not logged in
    if (!("authorization" in headers) || !headers.authorization) {
      return null
    }

    const next = await getCacheOptions("recent-orders")

    const response = await sdk.client.fetch<RecentOrdersResponse>(
      `/store/recent-orders`,
      {
        method: "GET",
        headers,
        next,
        cache: "no-store",
      }
    )

    if (!response || !response.orders || response.orders.length === 0) {
      return null
    }

    // Extract and deduplicate products from order items
    const productMap = new Map<
      string,
      HttpTypes.StoreProduct & { seller?: SellerProps }
    >()

    response.orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          // Product is nested under variant.product based on backend query
          const product = item.variant?.product || item.product
          if (product && product.id && !productMap.has(product.id)) {
            productMap.set(product.id, product)
          }
        })
      }
    })

    const products = Array.from(productMap.values())

    return products.length > 0 ? products : null
  } catch (error) {
    // Log error but don't throw - render page without recent orders section
    console.error("Failed to fetch recent order products:", error)
    return null
  }
}

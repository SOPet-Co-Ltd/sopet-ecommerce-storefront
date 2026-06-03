"use server"

import { SellerProps } from "@/types/seller"
import { sdk } from "../config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { listProducts, type ProductWithSeller } from "./products"
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
 * from the order items. Re-fetches each product via the store products API so variants
 * include region `calculated_price` (order snapshots do not). Returns null if
 * unauthenticated or no orders.
 */
export const getRecentOrderProducts = async ({
  countryCode,
}: {
  countryCode: string
}): Promise<ProductWithSeller[] | null> => {
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
          const withMeta = product as
            | (HttpTypes.StoreProduct & {
                metadata?: Record<string, unknown>
                seller?: SellerProps
              })
            | undefined
          if (withMeta && withMeta.id && !productMap.has(withMeta.id)) {
            productMap.set(withMeta.id, withMeta)
          }
        })
      }
    })

    const orderedIds = Array.from(productMap.keys())
    if (orderedIds.length === 0) {
      return null
    }

    const {
      response: { products: pricedProducts },
    } = await listProducts({
      countryCode,
      pageParam: 1,
      queryParams: { id: orderedIds, limit: orderedIds.length },
      skipPublishedToAlgoliaFilter: true,
      includeStats: false,
    })

    const byId = new Map(pricedProducts.map((p) => [p.id, p]))
    const ordered = orderedIds
      .map((id) => byId.get(id))
      .filter((p): p is ProductWithSeller => p != null)

    return ordered.length > 0 ? ordered : null
  } catch (error) {
    // Log error but don't throw - render page without recent orders section
    console.error("Failed to fetch recent order products:", error)
    return null
  }
}

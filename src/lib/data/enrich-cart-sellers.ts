"use server"

import { sdk } from "../config"
import { getAuthHeaders } from "./cookies"
import type { Cart } from "@/types/cart"

export async function enrichCartWithSellerData(cart: Cart): Promise<Cart> {
  const needsSellerFetch = (cart.items || []).some((item) => {
    const row = item as {
      product_id?: string
      product?: { id?: string; seller?: unknown }
    }
    const productId = row.product_id || row.product?.id
    if (!productId) {
      return false
    }

    return !row.product?.seller
  })

  if (!needsSellerFetch) {
    return cart
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const productIds = [
      ...new Set(
        (cart.items || [])
          .map((item) => {
            const row = item as {
              product_id?: string
              product?: { id?: string }
            }
            return row.product_id || row.product?.id
          })
          .filter(Boolean)
      ),
    ] as string[]

    if (productIds.length === 0) {
      return cart
    }

    const { products: sellerProducts } = await sdk.client.fetch<{
      products: Array<{
        id: string
        seller?: { id: string; name: string; handle?: string; photo?: string }
      }>
    }>(`/store/products`, {
      method: "GET",
      query: {
        id: productIds,
        fields: "*seller",
        limit: productIds.length,
      },
      headers,
      cache: "no-store",
    })

    const sellerMap = new Map<
      string,
      { id: string; name: string; handle?: string; photo?: string }
    >()
    for (const product of sellerProducts || []) {
      if (product.seller) {
        sellerMap.set(product.id, product.seller)
      }
    }

    for (const item of cart.items || []) {
      const row = item as {
        product_id?: string
        product?: {
          id?: string
          seller?: { id: string; name: string; handle?: string; photo?: string }
        }
        metadata?: Record<string, unknown> | null
      }
      const productId = row.product_id || row.product?.id
      const seller = productId ? sellerMap.get(productId) : undefined

      if (!seller) {
        continue
      }

      if (!row.product) {
        row.product = { id: productId }
      }

      row.product.seller = seller

      row.metadata = {
        ...(row.metadata ?? {}),
        seller_id: seller.id,
        seller_name: seller.name,
        seller_handle: seller.handle ?? null,
        seller_photo: seller.photo ?? null,
      }
    }
  } catch (error) {
    console.warn(
      "[enrichCartWithSellerData] Failed to enrich seller data:",
      error
    )
  }

  return cart
}

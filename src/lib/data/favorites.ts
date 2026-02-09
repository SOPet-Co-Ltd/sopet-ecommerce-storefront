"use server"

import { HttpTypes } from "@medusajs/types"
import { sdk } from "../config"
import { getAuthHeaders } from "./cookies"
import { getUserWishlists } from "./wishlist"
import { listProducts } from "./products"
import { ProductWithSeller } from "./products"

/**
 * Fetches user's favorite products from wishlist endpoint
 * Returns products with full details including seller, ratings, and stats
 */
export const getUserFavorites = async (
  countryCode?: string
): Promise<ProductWithSeller[]> => {
  try {
    // Try fetching from wishlist endpoint
    const wishlistResponse = await getUserWishlists()

    if (!wishlistResponse?.wishlists?.length) {
      return []
    }

    // Extract all products from all wishlists
    const allProducts = wishlistResponse.wishlists.flatMap(
      (wishlist) => wishlist.products || []
    )

    if (!allProducts.length) {
      return []
    }

    // If no countryCode provided, return products as-is (may need full details later)
    if (!countryCode) {
      return allProducts as ProductWithSeller[]
    }

    // Fetch full product details with stats, seller info, etc.
    // This ensures we have all the data needed for ProductCard component
    const productHandles = allProducts
      .map((p) => p.handle)
      .filter((handle): handle is string => Boolean(handle))

    if (!productHandles.length) {
      return allProducts as ProductWithSeller[]
    }

    const { response } = await listProducts({
      countryCode,
      queryParams: {
        handle: productHandles,
        limit: productHandles.length,
      },
    })

    // Create a map of fetched products by handle
    const fetchedProductsMap = new Map(
      response.products.map((p) => [p.handle, p])
    )

    // Return products in the same order as wishlist, with full details
    return allProducts
      .map((wishlistProduct) => {
        const fullProduct = fetchedProductsMap.get(wishlistProduct.handle)
        return fullProduct || (wishlistProduct as ProductWithSeller)
      })
      .filter((p) => p !== null) as ProductWithSeller[]
  } catch (error) {
    console.error("Error fetching favorites:", error)
    return []
  }
}

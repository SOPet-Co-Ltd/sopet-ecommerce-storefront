import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@/types/product"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
  average_rating?: number | string | null
  sold_count?: number | null
}

/**
 * Helper function to sort products by various criteria
 * @param products
 * @param sortBy
 * @returns products sorted by the specified criteria
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products] as MinPricedProduct[]

  // Relevance doesn't need client-side sorting (handled by Algolia)
  if (sortBy === "relevance") {
    return sortedProducts
  }

  if (sortBy === "best_selling") {
    sortedProducts.sort((a, b) => {
      const soldCountA = a.sold_count || 0
      const soldCountB = b.sold_count || 0
      return soldCountB - soldCountA // Descending order (most sold first)
    })
  }

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product._minPrice = Math.min(
          ...product.variants.map(
            (variant) => variant?.calculated_price?.calculated_amount || 0
          )
        )
      } else {
        product._minPrice = Infinity
      }
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  if (["rating_asc", "rating_desc"].includes(sortBy)) {
    sortedProducts.sort((a, b) => {
      const ratingA = typeof a.average_rating === "number" 
        ? a.average_rating 
        : typeof a.average_rating === "string" 
        ? parseFloat(a.average_rating) || 0 
        : 0
      const ratingB = typeof b.average_rating === "number" 
        ? b.average_rating 
        : typeof b.average_rating === "string" 
        ? parseFloat(b.average_rating) || 0 
        : 0
      return sortBy === "rating_asc" ? ratingA - ratingB : ratingB - ratingA
    })
  }

  return sortedProducts
}

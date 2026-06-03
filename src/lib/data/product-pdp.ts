import { cache } from "react"

import { listProducts, type ProductWithSeller } from "./products"

/**
 * Deduplicates PDP product fetch between generateMetadata and the page in a single request.
 */
export const getProductByHandleForPdp = cache(
  async (
    handle: string,
    locale: string
  ): Promise<ProductWithSeller | undefined> => {
    const { response } = await listProducts({
      countryCode: locale,
      queryParams: { handle: [handle], limit: 1 },
      forceCache: true,
      includeStats: true,
    })
    return response.products[0]
  }
)

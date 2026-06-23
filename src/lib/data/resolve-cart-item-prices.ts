import "server-only"

import { sdk } from "@/lib/config"
import { getPricesForVariant } from "@/lib/helpers/get-product-price"
import { DEFAULT_REGION } from "@/lib/site-defaults"
import type { HttpTypes } from "@medusajs/types"

import { getRegion } from "./regions"

export type CartItemPriceLookup = {
  productId: string
  variantId: string
}

export class CartItemPriceResolutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CartItemPriceResolutionError"
  }
}

export const buildCartItemPriceKey = (productId: string, variantId: string) => {
  return `${productId}|${variantId}`
}

export async function resolveCartItemUnitPrices(
  locale: string,
  items: CartItemPriceLookup[]
): Promise<Map<string, number>> {
  if (!items.length) {
    return new Map()
  }

  const countryCode = locale?.trim().toLowerCase() || DEFAULT_REGION
  const productIds = Array.from(
    new Set(
      items
        .map((item) => item.productId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  if (!productIds.length) {
    throw new CartItemPriceResolutionError("Product id is required")
  }

  const region = await getRegion(countryCode)

  let products: HttpTypes.StoreProduct[] = []

  try {
    const response = await sdk.client.fetch<{
      products: HttpTypes.StoreProduct[]
    }>("/store/products", {
      method: "GET",
      query: {
        id: productIds,
        limit: productIds.length,
        country_code: countryCode,
        region_id: region?.id,
        fields: "id,*variants,*variants.calculated_price",
      },
      cache: "no-store",
    })

    products = response.products ?? []
  } catch {
    products = []
  }

  const productsById = new Map(products.map((product) => [product.id, product]))
  const prices = new Map<string, number>()

  for (const item of items) {
    const key = buildCartItemPriceKey(item.productId, item.variantId)

    if (prices.has(key)) {
      continue
    }

    const product = productsById.get(item.productId)
    const variant = product?.variants?.find(
      (candidate) => candidate.id === item.variantId
    )

    const variantPrice = variant ? getPricesForVariant(variant) : null
    const unitPrice = variantPrice?.calculated_price_number

    if (typeof unitPrice !== "number" || !Number.isFinite(unitPrice)) {
      throw new CartItemPriceResolutionError(
        `No price found for variant ${item.variantId}`
      )
    }

    prices.set(key, unitPrice)
  }

  return prices
}

import type { GA4Item } from "./gtag"
import type { OrderLineItem } from "@/types/order"

/**
 * Helper utilities to convert Medusa product data to GA4 format
 */

/**
 * Convert Medusa product variant to GA4 Item format
 */
export const convertProductToGA4Item = (product: {
  id: string
  title: string
  variants?: Array<{
    id: string
    title?: string
    calculated_price?: {
      calculated_amount?: number
      currency_code?: string
    }
  }>
  categories?: Array<{ name: string }>
  collection?: { title?: string }
}): GA4Item => {
  const variant = product.variants?.[0]
  const price = variant?.calculated_price?.calculated_amount
    ? variant.calculated_price.calculated_amount / 100 // Convert from cents
    : undefined

  return {
    item_id: product.id,
    item_name: product.title,
    currency: variant?.calculated_price?.currency_code?.toUpperCase() || "THB",
    price,
    item_category: product.categories?.[0]?.name,
    item_category2: product.categories?.[1]?.name,
    item_brand: product.collection?.title,
    quantity: 1,
  }
}

/**
 * Convert cart line item to GA4 Item format
 */
export const convertCartItemToGA4Item = (item: {
  id: string
  title: string
  quantity: number
  variant?: {
    id: string
    title?: string
    product?: {
      id: string
      title?: string
      categories?: Array<{ name: string }>
      collection?: { title?: string }
    }
  }
  unit_price?: number
  total?: number
  currency_code?: string
}): GA4Item => {
  const price = item.unit_price ? item.unit_price / 100 : undefined
  const product = item.variant?.product

  return {
    item_id: item.variant?.id || item.id,
    item_name: item.title,
    currency: item.currency_code?.toUpperCase() || "THB",
    price,
    quantity: item.quantity,
    item_category: product?.categories?.[0]?.name,
    item_category2: product?.categories?.[1]?.name,
    item_brand: product?.collection?.title,
    item_variant: item.variant?.title,
  }
}

/**
 * Convert order line item to GA4 Item format
 */
export const convertOrderLineItemToGA4Item = (
  item: OrderLineItem,
  currencyCode: string
): GA4Item => {
  const price = item.unit_price ? item.unit_price / 100 : undefined

  return {
    item_id: item.variant?.id || item.id,
    item_name: item.title,
    currency: currencyCode.toUpperCase() || "THB",
    price,
    quantity: item.quantity,
    item_variant: item.variant?.title || undefined,
  }
}

/**
 * Calculate total value from items
 */
export const calculateTotalValue = (items: GA4Item[]): number => {
  return items.reduce((total, item) => {
    const price = item.price || 0
    const quantity = item.quantity || 1
    return total + price * quantity
  }, 0)
}

/**
 * Get currency from items (uses first item's currency)
 */
export const getCurrencyFromItems = (items: GA4Item[]): string => {
  return items[0]?.currency || "THB"
}

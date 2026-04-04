import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-precentage-diff"
import { convertToLocale } from "./money"
import { BaseHit, Hit } from "instantsearch.js"

const variantHasDisplayablePrice = (v: any) => {
  const cp = v?.calculated_price
  return !!(
    cp &&
    (cp.calculated_amount_with_tax != null || cp.calculated_amount != null)
  )
}

export const getPricesForVariant = (variant: any) => {
  if (!variantHasDisplayablePrice(variant)) {
    return null
  }

  if (!variant?.calculated_price?.calculated_amount_with_tax) {
    return {
      calculated_price_number: variant.calculated_price.calculated_amount,
      calculated_price: convertToLocale({
        amount: variant.calculated_price.calculated_amount,
        currency_code: variant.calculated_price.currency_code,
      }),
      calculated_price_without_tax: convertToLocale({
        amount: variant.calculated_price.calculated_amount_without_tax,
        currency_code: variant.calculated_price.currency_code,
      }),
      calculated_price_without_tax_number:
        variant.calculated_price.calculated_amount_without_tax,
      original_price_number: variant.calculated_price.original_amount,
      original_price: convertToLocale({
        amount: variant.calculated_price.original_amount,
        currency_code: variant.calculated_price.currency_code,
      }),
      currency_code: variant.calculated_price.currency_code,
      price_type: variant.calculated_price.calculated_price.price_list_type,
      percentage_diff: getPercentageDiff(
        variant.calculated_price.original_amount,
        variant.calculated_price.calculated_amount
      ),
    }
  }

  return {
    calculated_price_number:
      variant.calculated_price.calculated_amount_with_tax,
    calculated_price: convertToLocale({
      amount: variant.calculated_price.calculated_amount_with_tax,
      currency_code: variant.calculated_price.currency_code,
    }),
    calculated_price_without_tax: convertToLocale({
      amount: variant.calculated_price.calculated_amount_without_tax,
      currency_code: variant.calculated_price.currency_code,
    }),
    calculated_price_without_tax_number:
      variant.calculated_price.calculated_amount_without_tax,
    original_price_number: variant.calculated_price.original_amount_with_tax,
    original_price: convertToLocale({
      amount: variant.calculated_price.original_amount_with_tax,
      currency_code: variant.calculated_price.currency_code,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type: variant.calculated_price.calculated_price.price_list_type,
    percentage_diff: getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount
    ),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: Hit<HttpTypes.StoreProduct> | Partial<Hit<BaseHit>>
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestVariant = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    return product.variants
      .filter((v: any) => variantHasDisplayablePrice(v))
      .sort((a: any, b: any) => {
        const awt = a.calculated_price?.calculated_amount_with_tax
        const bwt = b.calculated_price?.calculated_amount_with_tax
        if (awt != null && bwt != null) {
          return awt - bwt
        }
        const aa = a.calculated_price?.calculated_amount ?? 0
        const ba = b.calculated_price?.calculated_amount ?? 0
        return aa - ba
      })[0]
  }

  const expensiveVariant = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    return product.variants
      .filter((v: any) => variantHasDisplayablePrice(v))
      .sort((a: any, b: any) => {
        const awt = a.calculated_price?.calculated_amount_with_tax
        const bwt = b.calculated_price?.calculated_amount_with_tax
        if (awt != null && bwt != null) {
          return bwt - awt
        }
        const aa = a.calculated_price?.calculated_amount ?? 0
        const ba = b.calculated_price?.calculated_amount ?? 0
        return ba - aa
      })[0]
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const variant: any = cheapestVariant()

    return getPricesForVariant(variant)
  }

  const expensivePrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const variant: any = expensiveVariant()

    return getPricesForVariant(variant)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant: any = product.variants?.find(
      (v: any) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    expensivePrice: expensivePrice(),
    variantPrice: variantPrice(),
    cheapestVariant: cheapestVariant(),
    expensiveVariant: expensiveVariant(),
  }
}

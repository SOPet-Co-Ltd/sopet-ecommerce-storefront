import "server-only"

import { sdk } from "@/lib/config"
import { getRegion } from "./regions"
import type { Cart } from "@/types/cart"
import type { AnonymousCartItemInput } from "@/types/customer-cart"
import type { HttpTypes } from "@medusajs/types"
import {
  getCartItemSeller,
  getCartItemVariantOptionsFromMetadata,
} from "@/lib/helpers/cart-seller"

const buildLineItemIdFromAnonymousItem = (
  item: AnonymousCartItemInput,
  index: number
) => {
  return item.id || `${item.productId}:${item.variantId}:${index.toString(36)}`
}

export async function resolveAnonymousCartPage(
  locale: string,
  items: AnonymousCartItemInput[]
): Promise<Cart | null> {
  if (!items.length) {
    return null
  }

  const productIds = Array.from(
    new Set(
      items
        .map((item) => item.productId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )

  const region = await getRegion(locale)

  let products: Array<
    HttpTypes.StoreProduct & {
      seller?: {
        id?: string | null
        name?: string | null
        handle?: string | null
        photo?: string | null
      } | null
    }
  > = []

  if (productIds.length > 0) {
    try {
      const response = await sdk.client.fetch<{
        products: typeof products
      }>("/store/products", {
        method: "GET",
        query: {
          id: productIds,
          limit: productIds.length,
          country_code: locale,
          region_id: region?.id,
          fields:
            "id,title,handle,thumbnail,*images,*seller,*variants,+variants.inventory_quantity,*variants.options,*variants.options.option",
        },
        cache: "no-store",
      })

      products = response.products ?? []
    } catch {
      products = []
    }
  }

  const productsById = new Map(products.map((product) => [product.id, product]))

  const lineItems = items.map((item, index) => {
    const id = buildLineItemIdFromAnonymousItem(item, index)
    const metadata =
      (item.metadata as Record<string, unknown> | null | undefined) ?? null
    const quantity = item.quantity ?? 1
    const unitPrice =
      typeof item.unitPriceSnapshot === "number" ? item.unitPriceSnapshot : 0
    const product = productsById.get(item.productId)
    const variant =
      product?.variants?.find((candidate) => candidate.id === item.variantId) ??
      undefined
    const variantOptions =
      (variant?.options?.length ? variant.options : undefined) ??
      getCartItemVariantOptionsFromMetadata(metadata)
    const seller = getCartItemSeller(
      {
        id,
        product_id: item.productId,
        variant_id: item.variantId,
        metadata,
        product,
      },
      product?.seller
    )

    const productTitle =
      product?.title ??
      (typeof metadata?.product_title === "string" ? metadata.product_title : "")
    const productHandle =
      product?.handle ??
      (typeof metadata?.product_handle === "string"
        ? metadata.product_handle
        : "")
    const thumbnail =
      product?.thumbnail ??
      product?.images?.[0]?.url ??
      (typeof metadata?.thumbnail === "string" ? metadata.thumbnail : undefined)
    const variantTitle =
      variant?.title ??
      (typeof metadata?.variant_title === "string"
        ? metadata.variant_title
        : undefined)
    const maxQuantity =
      typeof (variant as { inventory_quantity?: number } | undefined)
        ?.inventory_quantity === "number" &&
      (variant as { inventory_quantity?: number }).inventory_quantity! >= 0
        ? (variant as { inventory_quantity?: number }).inventory_quantity
        : undefined

    return {
      id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity,
      unit_price: unitPrice,
      total: unitPrice * quantity,
      subtotal: unitPrice * quantity,
      product_title: productTitle,
      product_handle: productHandle,
      thumbnail,
      variant_title: variantTitle,
      product:
        product || productTitle || productHandle || thumbnail || seller
          ? ({
              ...(product ?? {}),
              id: item.productId,
              title: productTitle,
              handle: productHandle,
              thumbnail: thumbnail ?? undefined,
              seller: seller ?? product?.seller ?? undefined,
            } as HttpTypes.StoreProduct)
          : undefined,
      variant:
        variant || variantTitle || variantOptions?.length
          ? ({
              ...(variant ?? {}),
              id: item.variantId,
              title: variantTitle,
              options: variantOptions,
            } as HttpTypes.StoreProductVariant)
          : undefined,
      metadata,
      ...(typeof maxQuantity === "number" ? { max_quantity: maxQuantity } : {}),
    } as unknown as HttpTypes.StoreCartLineItem & { max_quantity?: number }
  })

  const subtotal = lineItems.reduce(
    (sum, lineItem) => sum + (Number(lineItem.subtotal) || 0),
    0
  )
  const total = lineItems.reduce(
    (sum, lineItem) => sum + (Number(lineItem.total) || 0),
    0
  )

  return {
    id: "anonymous-local-cart",
    items: lineItems,
    currency_code: region?.currency_code ?? "THB",
    subtotal,
    total,
    tax_total: 0,
    discount_total: 0,
    item_subtotal: subtotal,
    promotions: [],
  } as unknown as Cart
}

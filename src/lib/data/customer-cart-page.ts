"use server"

import { redirect } from "next/navigation"
import type { Cart } from "@/types/cart"
import type { CustomerCartItemFromApi } from "./customer-cart"
import {
  getOrCreateCustomerCart,
  listCustomerCartItemsInCart,
} from "./customer-cart"
import type { HttpTypes } from "@medusajs/types"
import { listProducts, type ProductWithSeller } from "./products"

/** Cart line item with optional subtotal (from API totals). */
type LineItemWithTotals = HttpTypes.StoreCartLineItem & { subtotal?: unknown }

/** Coerce line item total to number (handles BigNumberValue or number). */
function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (value != null && typeof value === "object" && "value" in value) {
    const v = (value as { value?: unknown }).value
    if (typeof v === "number" && Number.isFinite(v)) return v
  }
  return 0
}

function computeTotals(
  items: LineItemWithTotals[]
): Pick<Cart, "subtotal" | "total" | "tax_total" | "discount_total"> {
  let subtotal = 0
  let total = 0

  for (const item of items) {
    const lineTotal =
      toNumber(item.total) || (item.unit_price ?? 0) * (item.quantity ?? 0)
    const lineSubtotal = toNumber(item.subtotal) || lineTotal

    subtotal += lineSubtotal
    total += lineTotal
  }

  const tax_total = total - subtotal

  return {
    subtotal: subtotal || 0,
    total: total || 0,
    tax_total: tax_total || 0,
    discount_total: 0,
  }
}

export async function getCartForCustomerCartPage(
  locale: string
): Promise<Cart | null> {
  // Ensure a customer cart exists if the user is authenticated.
  try {
    await getOrCreateCustomerCart()
  } catch {
    // Not authenticated – no customer cart.
  }

  let customerItems: CustomerCartItemFromApi[] = []
  try {
    customerItems = await listCustomerCartItemsInCart()
  } catch {
    customerItems = []
  }

  if (!customerItems.length) {
    return null
  }

  // Load products for the items in the customer cart so we can build
  // a cart-like structure for the cart page without using /store/carts.
  const productIds = Array.from(
    new Set(customerItems.map((i) => i.product_id).filter(Boolean))
  )

  let products: ProductWithSeller[] = []

  if (productIds.length) {
    try {
      const { response } = await listProducts({
        countryCode: locale,
        queryParams: {
          id: productIds,
          limit: productIds.length,
        },
      })
      products = response.products
    } catch {
      products = []
    }
  }

  const productsById = new Map<string, ProductWithSeller>(
    products.map((p) => [p.id, p])
  )

  const lineItems: LineItemWithTotals[] = customerItems.map((item) => {
    const product = productsById.get(item.product_id)
    const variant =
      product?.variants?.find((v) => v.id === item.variant_id) ?? undefined

    const quantity = item.quantity ?? 1

    const unitPriceSnapshot =
      typeof item.unit_price_snapshot === "number"
        ? item.unit_price_snapshot
        : undefined

    const unit_price =
      unitPriceSnapshot ??
      (typeof variant?.calculated_price === "number"
        ? variant.calculated_price
        : 0)

    const lineTotal = unit_price * quantity

    const thumbnail =
      product?.thumbnail ??
      (product?.images && product.images.length > 0
        ? (product.images[0]?.url ?? null)
        : null)

    const variantInventory =
      variant && "inventory_quantity" in variant
        ? (variant as { inventory_quantity?: number }).inventory_quantity
        : undefined
    const max_quantity =
      typeof variantInventory === "number" && variantInventory >= 0
        ? variantInventory
        : undefined

    const lineItem = {
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity,
      unit_price,
      total: lineTotal,
      subtotal: lineTotal,
      product_title: product?.title ?? "",
      product_handle: product?.handle ?? "",
      thumbnail: thumbnail ?? undefined,
      variant_title: variant?.title ?? undefined,
      product: product as unknown as HttpTypes.StoreProduct,
      variant: variant as unknown as HttpTypes.StoreProductVariant,
      metadata: item.metadata ?? null,
      max_quantity,
    } as unknown as LineItemWithTotals

    return lineItem
  })

  const totals = computeTotals(lineItems)

  const currency_code =
    products
      .flatMap((p) => p.variants || [])
      .map((v) => (v as { currency_code?: string }).currency_code)
      .find((c): c is string => typeof c === "string" && c.length > 0) ?? "THB"

  const cart = {
    id: "customer-cart",
    items: lineItems,
    currency_code,
    ...totals,
  } as Cart

  return cart
}

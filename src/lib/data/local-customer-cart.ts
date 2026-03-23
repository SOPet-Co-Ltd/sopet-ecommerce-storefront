"use client"

import type { HttpTypes } from "@medusajs/types"
import type { AnonymousCartItemInput } from "@/types/customer-cart"
import { mergeAnonymousCustomerCartFromClient } from "@/lib/actions/merge-anonymous-customer-cart"

const normalizeNullable = <T>(value: T | null | undefined): T | null =>
  value == null ? null : value

const serializeMetadata = (metadata: Record<string, unknown> | null) =>
  metadata ? JSON.stringify(metadata) : null

const buildAnonymousItemKey = (item: AnonymousCartItemInput): string => {
  return [
    item.productId,
    item.variantId,
    String(normalizeNullable(item.unitPriceSnapshot)),
    normalizeNullable(item.source) ?? "",
    serializeMetadata(
      (item.metadata as Record<string, unknown> | null | undefined) ?? null
    ) ?? "",
  ].join("|")
}

const buildLineItemIdFromAnonymousItem = (
  item: AnonymousCartItemInput,
  index: number
): string => {
  return item.id || `${item.productId}:${item.variantId}:${index.toString(36)}`
}

export interface LocalAnonymousCart {
  items: AnonymousCartItemInput[]
}

const findAnonymousItemIndexByLineItemId = (
  lineItemId: string,
  cart: LocalAnonymousCart
): number => {
  return cart.items.findIndex((item, index) => {
    const candidateId = buildLineItemIdFromAnonymousItem(item, index)
    return candidateId === lineItemId
  })
}

const LOCAL_STORAGE_KEY = "sopet_customer_cart_anonymous_v1"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const getAnonymousCart = (): LocalAnonymousCart => {
  if (typeof window === "undefined") {
    return { items: [] }
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
  if (!raw) {
    return { items: [] }
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return { items: [] }
    }

    const items = Array.isArray(parsed.items)
      ? (parsed.items as AnonymousCartItemInput[])
      : []

    return { items }
  } catch {
    return { items: [] }
  }
}

export const setAnonymousCart = (cart: LocalAnonymousCart): void => {
  if (typeof window === "undefined") {
    return
  }

  const payload: LocalAnonymousCart = {
    items: Array.isArray(cart.items) ? cart.items : [],
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload))
}

/**
 * Remove anonymous cart items by their line item IDs (as used in the cart UI).
 * Used before guest checkout so only non-selected items remain for merge after OTP.
 */
export const removeAnonymousCartItemsByIds = (lineItemIds: string[]): void => {
  if (typeof window === "undefined" || !lineItemIds.length) return

  const current = getAnonymousCart()
  const idSet = new Set(lineItemIds)
  const items = current.items.filter((item, index) => {
    const id = buildLineItemIdFromAnonymousItem(item, index)
    return !idSet.has(id)
  })
  setAnonymousCart({ items })
}

const MERGE_RETRY_DELAY_MS = 600

/**
 * Merge the current anonymous cart into the authenticated customer's
 * server-side customer cart immediately after login.
 *
 * - Sends the raw anonymous items to `/store/customer-cart/merge-anonymous`.
 * - Clears the local anonymous cart only if the merge succeeds.
 * - Retries once after a short delay if the first attempt fails (e.g. auth
 *   cookie not yet available right after OAuth redirect).
 */
export const mergeAnonymousCartIntoCustomerAfterLogin =
  async (): Promise<void> => {
    if (typeof window === "undefined") {
      return
    }

    const { items } = getAnonymousCart()

    if (!items.length) {
      console.info(
        "[local-customer-cart] No anonymous items to merge after login."
      )
      return
    }

    const attemptMerge = async (): Promise<boolean> => {
      const result = await mergeAnonymousCustomerCartFromClient(items)
      if (result?.merged) {
        setAnonymousCart({ items: [] })
        return true
      }
      return false
    }

    try {
      console.info(
        "[local-customer-cart] Attempting to merge anonymous cart into customer cart after login.",
        { itemCount: items.length }
      )

      let ok = await attemptMerge()

      if (!ok) {
        await new Promise((r) => setTimeout(r, MERGE_RETRY_DELAY_MS))
        ok = await attemptMerge()
      }

      if (ok) {
        console.info(
          "[local-customer-cart] Successfully merged anonymous cart into customer cart.",
          { itemCount: items.length }
        )
      } else {
        console.warn(
          "[local-customer-cart] Merge anonymous cart endpoint returned merged = false (after retry).",
          { itemCount: items.length }
        )
      }
    } catch (error) {
      console.error(
        "[local-customer-cart] Failed to merge anonymous cart into customer cart after login:",
        error
      )
      try {
        await new Promise((r) => setTimeout(r, MERGE_RETRY_DELAY_MS))
        const retryOk = await attemptMerge()
        if (retryOk) {
          console.info("[local-customer-cart] Merge succeeded on retry.", {
            itemCount: items.length,
          })
        }
      } catch (retryError) {
        console.error(
          "[local-customer-cart] Merge retry also failed:",
          retryError
        )
      }
    }
  }

export interface AddItemToAnonymousCartOptions {
  /** When set, resulting quantity (existing + new or just new) is capped at this value. */
  maxQuantity?: number
}

export const addItemToAnonymousCart = (
  item: AnonymousCartItemInput,
  options?: AddItemToAnonymousCartOptions
): LocalAnonymousCart => {
  const current = getAnonymousCart()
  const maxQty =
    typeof options?.maxQuantity === "number" && options.maxQuantity >= 0
      ? options.maxQuantity
      : undefined

  const items = [...current.items]

  const targetKey = buildAnonymousItemKey(item)

  const existingIndex = items.findIndex((existing) => {
    const existingKey = buildAnonymousItemKey(existing)
    return existingKey === targetKey
  })

  if (existingIndex >= 0) {
    const existing = items[existingIndex]
    let nextQuantity = (existing.quantity ?? 0) + (item.quantity ?? 0)
    if (maxQty !== undefined && nextQuantity > maxQty) {
      nextQuantity = maxQty
    }

    items[existingIndex] = {
      ...existing,
      quantity: nextQuantity,
    }
  } else {
    let quantity = item.quantity ?? 1
    if (maxQty !== undefined && quantity > maxQty) {
      quantity = maxQty
    }
    items.push({ ...item, quantity })
  }

  const next: LocalAnonymousCart = { items }
  setAnonymousCart(next)

  return next
}

export const mergeAnonymousCarts = (
  left: LocalAnonymousCart,
  right: LocalAnonymousCart
): LocalAnonymousCart => {
  const items = [...left.items, ...right.items]

  const merged: LocalAnonymousCart = { items }
  return merged
}

export const buildAnonymousCartFromLocal = (): HttpTypes.StoreCart | null => {
  const { items } = getAnonymousCart()

  if (!items.length) {
    return null
  }

  const lineItems = items.map((item, index) => {
    const unitPrice =
      typeof item.unitPriceSnapshot === "number" ? item.unitPriceSnapshot : 0
    const quantity = item.quantity ?? 1

    const meta = (item.metadata ?? {}) as Record<string, unknown>
    const productTitle = (meta.product_title as string) ?? ""
    const productHandle = (meta.product_handle as string) ?? ""
    const thumbnail = (meta.thumbnail as string) ?? undefined
    const variantTitle = (meta.variant_title as string) ?? undefined

    const id = buildLineItemIdFromAnonymousItem(item, index)

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
      product: undefined,
      variant: undefined,
      metadata: item.metadata ?? null,
    } as unknown as HttpTypes.StoreCartLineItem
  })

  const subtotal = lineItems.reduce(
    (acc, line) => acc + (Number(line.subtotal) || 0),
    0
  )
  const total = lineItems.reduce(
    (acc, line) => acc + (Number(line.total) || 0),
    0
  )

  const anonymousCart: HttpTypes.StoreCart = {
    id: "anonymous-local-cart",
    items: lineItems,
    currency_code: "THB",
    subtotal,
    total,
    tax_total: 0,
    discount_total: 0,
    discount_tax_total: 0,
    gift_card_total: 0,
    gift_card_tax_total: 0,
    shipping_total: 0,
    shipping_subtotal: 0,
    shipping_tax_total: 0,
    original_total: subtotal,
    original_subtotal: subtotal,
    original_tax_total: 0,
    original_item_total: subtotal,
    original_item_subtotal: subtotal,
    original_item_tax_total: 0,
    original_shipping_total: 0,
    original_shipping_subtotal: 0,
    original_shipping_tax_total: 0,
    item_total: subtotal,
    item_subtotal: subtotal,
    item_tax_total: 0,
    promotions: [],
  }

  return anonymousCart
}

export const updateAnonymousCartItemQuantity = (
  lineItemId: string,
  quantity: number
): HttpTypes.StoreCart | null => {
  if (quantity < 1) {
    return deleteAnonymousCartItem(lineItemId)
  }

  const current = getAnonymousCart()
  const index = findAnonymousItemIndexByLineItemId(lineItemId, current)

  if (index < 0) {
    return buildAnonymousCartFromLocal()
  }

  const items = [...current.items]
  const target = items[index]

  items[index] = {
    ...target,
    quantity,
  }

  setAnonymousCart({ items })

  return buildAnonymousCartFromLocal()
}

export const deleteAnonymousCartItem = (
  lineItemId: string
): HttpTypes.StoreCart | null => {
  const current = getAnonymousCart()
  const index = findAnonymousItemIndexByLineItemId(lineItemId, current)

  if (index < 0) {
    return buildAnonymousCartFromLocal()
  }

  const items = [...current.items]
  items.splice(index, 1)

  setAnonymousCart({ items })

  return buildAnonymousCartFromLocal()
}

export const changeAnonymousCartItemVariant = (input: {
  lineItemId: string
  variantId: string
  quantity: number
  unitPriceSnapshot?: number | null
  metadataOverrides?: Record<string, unknown> | null
}): HttpTypes.StoreCart | null => {
  const {
    lineItemId,
    variantId,
    quantity,
    unitPriceSnapshot,
    metadataOverrides,
  } = input

  const current = getAnonymousCart()
  const index = findAnonymousItemIndexByLineItemId(lineItemId, current)

  if (index < 0) {
    return buildAnonymousCartFromLocal()
  }

  const items = [...current.items]
  const currentItem = items[index]

  const updated: AnonymousCartItemInput = {
    ...currentItem,
    variantId,
    quantity,
    unitPriceSnapshot:
      typeof unitPriceSnapshot === "number"
        ? unitPriceSnapshot
        : currentItem.unitPriceSnapshot,
    metadata:
      metadataOverrides !== undefined
        ? metadataOverrides
        : currentItem.metadata,
  }

  const targetKey = buildAnonymousItemKey(updated)

  const existingSameIndex = items.findIndex((item, idx) => {
    if (idx === index) return false
    return buildAnonymousItemKey(item) === targetKey
  })

  if (existingSameIndex >= 0) {
    const existing = items[existingSameIndex]
    const nextQuantity = (existing.quantity ?? 0) + (updated.quantity ?? 0)

    items[existingSameIndex] = {
      ...existing,
      quantity: nextQuantity,
    }

    items.splice(index, 1)
  } else {
    items[index] = updated
  }

  setAnonymousCart({ items })

  return buildAnonymousCartFromLocal()
}

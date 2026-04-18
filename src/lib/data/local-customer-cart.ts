"use client"

import type { HttpTypes } from "@medusajs/types"
import type { AnonymousCartItemInput } from "@/types/customer-cart"
import { mergeAnonymousCustomerCartFromClient } from "@/lib/actions/merge-anonymous-customer-cart"
import {
  getCartItemSeller,
  getCartItemVariantOptionsFromMetadata,
} from "@/lib/helpers/cart-seller"

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

export interface LocalAnonymousCheckoutHold {
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
const CHECKOUT_HOLD_STORAGE_KEY = "sopet_customer_cart_anonymous_checkout_hold_v1"
export const ANONYMOUS_CART_SYNC_EVENT = "sopet:anonymous-cart-sync"

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
  window.dispatchEvent(new Event(ANONYMOUS_CART_SYNC_EVENT))
}

export const getAnonymousCheckoutHold = (): LocalAnonymousCheckoutHold => {
  if (typeof window === "undefined") {
    return { items: [] }
  }

  const raw = window.localStorage.getItem(CHECKOUT_HOLD_STORAGE_KEY)
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

export const setAnonymousCheckoutHold = (
  hold: LocalAnonymousCheckoutHold
): void => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    CHECKOUT_HOLD_STORAGE_KEY,
    JSON.stringify({
      items: Array.isArray(hold.items) ? hold.items : [],
    } satisfies LocalAnonymousCheckoutHold)
  )
}

export const clearAnonymousCheckoutHold = (): void => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(CHECKOUT_HOLD_STORAGE_KEY)
}

const mergeAnonymousItemLists = (
  left: AnonymousCartItemInput[],
  right: AnonymousCartItemInput[]
): AnonymousCartItemInput[] => {
  const byKey = new Map<string, AnonymousCartItemInput>()

  for (const item of [...left, ...right]) {
    const key = buildAnonymousItemKey(item)
    const existing = byKey.get(key)

    if (existing) {
      byKey.set(key, {
        ...existing,
        quantity: (existing.quantity ?? 0) + (item.quantity ?? 0),
      })
      continue
    }

    byKey.set(key, { ...item })
  }

  return Array.from(byKey.values())
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

export const moveAnonymousCartItemsToCheckoutHoldByIds = (
  lineItemIds: string[]
): void => {
  if (typeof window === "undefined" || !lineItemIds.length) {
    return
  }

  const current = getAnonymousCart()
  const idSet = new Set(lineItemIds)
  const movedItems: AnonymousCartItemInput[] = []
  const remainingItems = current.items.filter((item, index) => {
    const lineItemId = buildLineItemIdFromAnonymousItem(item, index)
    if (!idSet.has(lineItemId)) {
      return true
    }

    movedItems.push(item)
    return false
  })

  if (!movedItems.length) {
    return
  }

  const currentHold = getAnonymousCheckoutHold()
  setAnonymousCheckoutHold({
    items: mergeAnonymousItemLists(currentHold.items, movedItems),
  })
  setAnonymousCart({ items: remainingItems })
}

export const restoreAnonymousCheckoutHoldToAnonymousCart = (): boolean => {
  if (typeof window === "undefined") {
    return false
  }

  const hold = getAnonymousCheckoutHold()
  if (!hold.items.length) {
    return false
  }

  const current = getAnonymousCart()
  setAnonymousCart({
    items: mergeAnonymousItemLists(current.items, hold.items),
  })
  clearAnonymousCheckoutHold()

  return true
}

export const mergeAnonymousCheckoutHoldIntoCustomerCart =
  async (): Promise<boolean> => {
    if (typeof window === "undefined") {
      return false
    }

    const hold = getAnonymousCheckoutHold()
    if (!hold.items.length) {
      return false
    }

    const result = await mergeAnonymousCustomerCartFromClient(hold.items)

    if (result?.merged) {
      clearAnonymousCheckoutHold()
      return true
    }

    return false
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
  return {
    items: mergeAnonymousItemLists(left.items, right.items),
  }
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
    const variantOptions = getCartItemVariantOptionsFromMetadata(meta)

    const id = buildLineItemIdFromAnonymousItem(item, index)
    const seller = getCartItemSeller({
      id,
      product_id: item.productId,
      variant_id: item.variantId,
      metadata: item.metadata ?? null,
    })

    const product =
      productTitle || productHandle || thumbnail || seller
        ? ({
            id: item.productId,
            title: productTitle,
            handle: productHandle,
            thumbnail,
            seller: seller ?? undefined,
          } as unknown as HttpTypes.StoreProduct)
        : undefined

    const variant = variantTitle || variantOptions?.length
      ? ({
          id: item.variantId,
          title: variantTitle,
          options: variantOptions,
        } as unknown as HttpTypes.StoreProductVariant)
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
      product,
      variant,
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

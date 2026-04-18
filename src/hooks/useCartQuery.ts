"use client"

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useEffect } from "react"

import { queryKeys } from "@/lib/react-query/query-keys"
import type { Cart } from "@/types/cart"
import type { CustomerCartItemCreateInput } from "@/types/customer-cart"
import {
  ANONYMOUS_CART_SYNC_EVENT,
  addItemToAnonymousCart,
  buildAnonymousCartFromLocal,
  changeAnonymousCartItemVariant,
  deleteAnonymousCartItem,
  getAnonymousCart,
  updateAnonymousCartItemQuantity,
} from "@/lib/data/local-customer-cart"
import type { HttpTypes } from "@medusajs/types"

export type CartSource = "customer" | "anonymous"

type CartLike = Cart | HttpTypes.StoreCart | null

type UseCartQueryOptions = {
  locale: string
  source: CartSource
  initialData?: CartLike
}

type AddToCartMutationInput = CustomerCartItemCreateInput & {
  currencyCode?: string
  maxQuantity?: number
  optimisticItem?: Partial<HttpTypes.StoreCartLineItem> & {
    quantity?: number
  }
}

type UpdateCartItemInput = {
  itemId: string
  quantity: number
}

type DeleteCartItemInput = {
  itemId: string
}

type ChangeCartItemVariantInput = {
  itemId: string
  variantId: string
  quantity: number
  unitPriceSnapshot?: number | null
  metadataOverrides?: Record<string, unknown> | null
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchCustomerCart(locale: string): Promise<CartLike> {
  const response = await fetch(`/api/cart?locale=${encodeURIComponent(locale)}`, {
    cache: "no-store",
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error("Failed to fetch customer cart")
  }

  const payload = await parseJson<{ cart?: CartLike }>(response)
  return payload.cart ?? null
}

async function resolveAnonymousCart(locale: string): Promise<CartLike> {
  const anonymousCart = getAnonymousCart()

  if (!anonymousCart.items.length) {
    return null
  }

  try {
    const response = await fetch("/api/cart/anonymous", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale,
        items: anonymousCart.items,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to resolve anonymous cart")
    }

    const payload = await parseJson<{ cart?: CartLike }>(response)
    return payload.cart ?? buildAnonymousCartFromLocal()
  } catch {
    return buildAnonymousCartFromLocal()
  }
}

function getNumeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function getCartTotals(items: HttpTypes.StoreCartLineItem[]) {
  return items.reduce(
    (acc, item) => {
      const subtotal = getNumeric(item.subtotal)
      const total = getNumeric(item.total)
      const taxTotal = getNumeric(item.tax_total)

      return {
        subtotal: acc.subtotal + subtotal,
        total: acc.total + total,
        tax_total: acc.tax_total + taxTotal,
      }
    },
    { subtotal: 0, total: 0, tax_total: 0 }
  )
}

function applyOptimisticAddToCart(
  cart: CartLike,
  input: AddToCartMutationInput,
  source: CartSource
): CartLike {
  const optimisticItem = input.optimisticItem

  if (!optimisticItem) {
    return cart
  }

  const currentItems = [...(cart?.items ?? [])]
  const existingIndex = currentItems.findIndex(
    (item) => item.variant_id === input.variantId
  )

  if (existingIndex >= 0) {
    const currentItem = currentItems[existingIndex]
    currentItems[existingIndex] = {
      ...currentItem,
      quantity: (currentItem.quantity ?? 0) + input.quantity,
      subtotal:
        getNumeric(currentItem.subtotal) + getNumeric(optimisticItem.subtotal),
      total: getNumeric(currentItem.total) + getNumeric(optimisticItem.total),
      tax_total:
        getNumeric(currentItem.tax_total) + getNumeric(optimisticItem.tax_total),
    } as HttpTypes.StoreCartLineItem
  } else {
    currentItems.push({
      ...optimisticItem,
      id:
        optimisticItem.id ||
        `optimistic:${input.productId}:${input.variantId}:${currentItems.length}`,
      product_id: input.productId,
      variant_id: input.variantId,
      quantity: input.quantity,
    } as HttpTypes.StoreCartLineItem)
  }

  const totals = getCartTotals(currentItems)

  return {
    ...(cart ?? {
      id: source === "anonymous" ? "anonymous-local-cart" : "customer-cart",
      currency_code: input.currencyCode || "THB",
      promotions: [],
    }),
    items: currentItems,
    subtotal: totals.subtotal,
    item_subtotal: totals.subtotal,
    total: totals.total,
    tax_total: totals.tax_total,
    discount_total: getNumeric(cart?.discount_total),
  } as Cart
}

export function useCartQuery({
  locale,
  source,
  initialData,
}: UseCartQueryOptions) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.cart.page(locale, source)

  useEffect(() => {
    if (source !== "anonymous" || typeof window === "undefined") {
      return
    }

    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey,
      })
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !event.key.includes("sopet_customer_cart_anonymous_v1")) {
        return
      }

      invalidate()
    }

    window.addEventListener(
      ANONYMOUS_CART_SYNC_EVENT,
      invalidate as EventListener
    )
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener(
        ANONYMOUS_CART_SYNC_EVENT,
        invalidate as EventListener
      )
      window.removeEventListener("storage", handleStorage)
    }
  }, [queryClient, queryKey, source])

  const resolvedInitialData =
    source === "anonymous"
      ? (initialData ?? buildAnonymousCartFromLocal())
      : initialData

  return useQuery({
    queryKey,
    queryFn: () =>
      source === "customer"
        ? fetchCustomerCart(locale)
        : resolveAnonymousCart(locale),
    initialData: resolvedInitialData,
    staleTime: source === "customer" ? 30 * 1000 : 0,
    refetchOnWindowFocus: source === "customer",
  })
}

export function useAddToCartMutation(locale: string, source: CartSource) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.cart.page(locale, source)

  return useMutation({
    mutationFn: async (input: AddToCartMutationInput) => {
      if (source === "anonymous") {
        addItemToAnonymousCart(
          {
            productId: input.productId,
            variantId: input.variantId,
            quantity: input.quantity,
            unitPriceSnapshot: input.unitPriceSnapshot,
            source: input.source,
            metadata: input.metadata,
          },
          { maxQuantity: input.maxQuantity }
        )
        return null
      }

      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              productId: input.productId,
              variantId: input.variantId,
              quantity: input.quantity,
              unitPriceSnapshot: input.unitPriceSnapshot,
              source: input.source,
              metadata: input.metadata,
            },
          ],
        }),
      })

      if (!response.ok) {
        const payload = await parseJson<{ message?: string }>(response)
        throw new Error(payload.message || "Failed to add item to cart")
      }

      return parseJson(response)
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey })
      const previousCart = queryClient.getQueryData<CartLike>(queryKey)

      queryClient.setQueryData<CartLike>(queryKey, (current) =>
        applyOptimisticAddToCart(current ?? previousCart ?? null, input, source)
      )

      return {
        previousCart,
      }
    },
    onError: (_error, _input, context) => {
      if (context?.previousCart !== undefined) {
        queryClient.setQueryData(queryKey, context.previousCart)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useUpdateCartItemMutation(locale: string, source: CartSource) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.cart.page(locale, source)

  return useMutation({
    mutationFn: async ({ itemId, quantity }: UpdateCartItemInput) => {
      if (source === "anonymous") {
        updateAnonymousCartItemQuantity(itemId, quantity)
        return null
      }

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
        }),
      })

      if (!response.ok) {
        const payload = await parseJson<{ message?: string }>(response)
        throw new Error(payload.message || "Failed to update cart item")
      }

      return parseJson(response)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useDeleteCartItemMutation(locale: string, source: CartSource) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.cart.page(locale, source)

  return useMutation({
    mutationFn: async ({ itemId }: DeleteCartItemInput) => {
      if (source === "anonymous") {
        deleteAnonymousCartItem(itemId)
        return null
      }

      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const payload = await parseJson<{ message?: string }>(response)
        throw new Error(payload.message || "Failed to delete cart item")
      }

      return parseJson(response)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}

export function useChangeCartItemVariantMutation(
  locale: string,
  source: CartSource
) {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.cart.page(locale, source)

  return useMutation({
    mutationFn: async ({
      itemId,
      variantId,
      quantity,
      unitPriceSnapshot,
      metadataOverrides,
    }: ChangeCartItemVariantInput) => {
      if (source === "anonymous") {
        changeAnonymousCartItemVariant({
          lineItemId: itemId,
          variantId,
          quantity,
          unitPriceSnapshot,
          metadataOverrides,
        })
        return null
      }

      const response = await fetch(`/api/cart/items/${itemId}/variant`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quantity,
          variantId,
        }),
      })

      if (!response.ok) {
        const payload = await parseJson<{ message?: string }>(response)
        throw new Error(payload.message || "Failed to change cart item variant")
      }

      return parseJson(response)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })
}

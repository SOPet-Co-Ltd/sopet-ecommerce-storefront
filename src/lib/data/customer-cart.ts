"use server"

import { fetchQuery, sdk } from "../config"
import { getAuthHeaders, getCartId, setCartId } from "./cookies"
import { redirect } from "next/navigation"
import type {
  AnonymousCartItemInput,
  CustomerCart,
  CustomerCartItemCreateInput,
  TransferToMedusaInput,
} from "@/types/customer-cart"
import { retrieveCart, getOrSetCart } from "./cart"
import { revalidatePath } from "next/cache"

interface CustomerCartApiResponse {
  cart: {
    id: string
    customer_id: string
  }
}

interface MergeAnonymousApiResponse {
  merged: boolean
  cart?: {
    id: string
    customer_id: string
  }
}

interface TransferToMedusaApiResponse {
  medusa_cart_id: string
}

interface TransferToMedusaErrorPayload {
  code?: string
  message?: string
  details?: unknown
}

interface CustomerCartItemsApiResponse {
  items: CustomerCartItemFromApi[]
}

/** Single item returned by GET/POST /store/customer-cart/items (customer_cart_item row). */
export type CustomerCartItemFromApi = {
  id: string
  cart_id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price_snapshot: number | null
  status: string
  source: string | null
  metadata: Record<string, unknown> | null
  product_title?: string | null
  product_handle?: string | null
  thumbnail?: string | null
  variant_title?: string | null
  seller?: {
    id?: string | null
    name?: string | null
    handle?: string | null
    photo?: string | null
  } | null
  max_quantity?: number | null
}

function parseTransferToMedusaError(error: any): TransferToMedusaErrorPayload {
  const body = error?.body

  if (!body) {
    return {
      message: error?.message ?? "Failed to transfer customer cart to checkout",
    }
  }

  if (typeof body === "object") {
    return {
      code: typeof body.code === "string" ? body.code : undefined,
      message:
        typeof body.message === "string"
          ? body.message
          : (error?.message ?? "Failed to transfer customer cart to checkout"),
      details: body.details,
    }
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body)
      return {
        code: typeof parsed?.code === "string" ? parsed.code : undefined,
        message:
          typeof parsed?.message === "string"
            ? parsed.message
            : (error?.message ??
              "Failed to transfer customer cart to checkout"),
        details: parsed?.details,
      }
    } catch {
      return {
        message:
          body ||
          error?.message ||
          "Failed to transfer customer cart to checkout",
      }
    }
  }

  return {
    message: error?.message ?? "Failed to transfer customer cart to checkout",
  }
}

export async function getOrCreateCustomerCart(): Promise<CustomerCart> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await sdk.client.fetch<unknown>("/store/customer-cart", {
    method: "GET",
    headers,
    cache: "no-store",
  })

  const payload = response as CustomerCartApiResponse

  if (!payload.cart?.id || !payload.cart.customer_id) {
    throw new Error("Invalid customer cart response")
  }

  return {
    id: payload.cart.id,
    customerId: payload.cart.customer_id,
  }
}

export async function addItemsToCustomerCart(
  items: CustomerCartItemCreateInput[]
): Promise<CustomerCartItemsApiResponse["items"]> {
  if (!items.length) {
    return []
  }

  try {
    const headers = {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    }

    const response = await sdk.client.fetch<unknown>(
      "/store/customer-cart/items",
      {
        method: "POST",
        headers,
        body: { items },
      }
    )

    const payload = response as {
      cart_id: string
      items?: CustomerCartItemsApiResponse["items"]
    }

    return payload.items ?? []
  } catch (error) {
    console.error("Error adding items to customer cart", error)
    throw error
  }
}

export async function mergeAnonymousCustomerCart(
  items: AnonymousCartItemInput[]
): Promise<MergeAnonymousApiResponse> {
  if (!items.length) {
    return { merged: false }
  }

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  }

  const response = await sdk.client.fetch<unknown>(
    "/store/customer-cart/merge-anonymous",
    {
      method: "POST",
      headers,
      body: { items },
      cache: "no-store",
    }
  )

  const payload = response as MergeAnonymousApiResponse & { error?: string }

  if (payload?.error && !payload.merged) {
    throw new Error(payload.error)
  }

  return payload
}

export async function listCustomerCartItemsInCart(): Promise<
  CustomerCartItemsApiResponse["items"]
> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await sdk.client.fetch<unknown>(
    "/store/customer-cart/items",
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  )

  const payload = response as CustomerCartItemsApiResponse

  return payload.items ?? []
}

export async function updateCustomerCartItem(input: {
  id: string
  quantity?: number
  variantId?: string
  unitPriceSnapshot?: number | null
  metadata?: Record<string, unknown> | null
}) {
  const { id, quantity, variantId, unitPriceSnapshot, metadata } = input

  if (!id) {
    throw new Error("Customer cart item id is required")
  }

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  }

  const body: Record<string, unknown> = {}

  if (typeof quantity === "number") {
    body.quantity = quantity
  }

  if (typeof variantId === "string") {
    body.variant_id = variantId
  }

  if (typeof unitPriceSnapshot === "number") {
    body.unit_price_snapshot = unitPriceSnapshot
  }

  if (metadata !== undefined) {
    body.metadata = metadata
  }

  if (Object.keys(body).length === 0) {
    throw new Error("No updatable fields provided for customer cart item")
  }

  await fetchQuery(`/store/customer-cart/items/${id}`, {
    method: "PATCH",
    body,
    headers,
    cache: "no-store",
  })

  revalidatePath("/cart")
}

export async function deleteCustomerCartItem(id: string) {
  if (!id) {
    throw new Error("Customer cart item id is required")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await fetchQuery(`/store/customer-cart/items/${id}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  })

  revalidatePath("/cart")
}

export async function changeCustomerCartItemVariant(input: {
  itemId: string
  variantId: string
  quantity: number
  unitPriceSnapshot?: number | null
}) {
  const { itemId, variantId, quantity, unitPriceSnapshot } = input

  if (!itemId || !variantId) {
    throw new Error("itemId and variantId are required")
  }

  const itemsInCart = await listCustomerCartItemsInCart()

  const currentItem = itemsInCart.find((item) => item.id === itemId)

  if (!currentItem) {
    await updateCustomerCartItem({
      id: itemId,
      quantity,
      variantId,
    })
    return
  }

  const buildKey = (item: CustomerCartItemFromApi) => {
    return [item.product_id, item.variant_id].join("|")
  }

  const targetKey = buildKey({
    ...currentItem,
    variant_id: variantId,
  })

  const existingSame = itemsInCart.find(
    (item) =>
      item.id !== itemId &&
      item.status === "in_cart" &&
      buildKey(item) === targetKey
  )

  if (existingSame) {
    const nextQuantity = (existingSame.quantity ?? 0) + quantity

    await updateCustomerCartItem({
      id: existingSame.id,
      quantity: nextQuantity,
      unitPriceSnapshot,
    })

    await deleteCustomerCartItem(itemId)
    return
  }

  await updateCustomerCartItem({
    id: itemId,
    quantity,
    variantId,
    unitPriceSnapshot,
  })
}

export async function transferCustomerCartItemsToMedusa(
  input: TransferToMedusaInput & { promotionCodes?: string[] }
): Promise<string> {
  const {
    customerCartItemIds,
    regionId,
    salesChannelId,
    currencyCode,
    promotionCodes = [],
  } = input

  if (!customerCartItemIds.length) {
    throw new Error("customerCartItemIds is required")
  }

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  }

  let response: unknown
  try {
    response = await sdk.client.fetch<unknown>(
      "/store/customer-cart/transfer-to-medusa",
      {
        method: "POST",
        headers,
        body: {
          customer_cart_item_ids: customerCartItemIds,
          region_id: regionId,
          sales_channel_id: salesChannelId,
          currency_code: currencyCode,
        },
        cache: "no-store",
      }
    )
  } catch (error: any) {
    const parsedError = parseTransferToMedusaError(error)

    console.error("[transfer-to-medusa] Request failed", {
      status: error?.status ?? error?.cause?.status,
      code: parsedError.code,
      message: parsedError.message,
      details: parsedError.details,
      customerCartItemCount: customerCartItemIds.length,
      hasRegionId: Boolean(regionId),
      hasSalesChannelId: Boolean(salesChannelId),
      currencyCode: currencyCode ?? null,
    })

    const normalizedError = new Error(
      parsedError.message ?? "Failed to transfer customer cart to checkout"
    )
    ;(normalizedError as Error & { code?: string; details?: unknown }).code =
      parsedError.code
    ;(normalizedError as Error & { code?: string; details?: unknown }).details =
      parsedError.details

    throw normalizedError
  }

  const payload = response as TransferToMedusaApiResponse

  if (!payload.medusa_cart_id) {
    console.error("[transfer-to-medusa] Invalid success payload", {
      customerCartItemCount: customerCartItemIds.length,
      hasRegionId: Boolean(regionId),
      hasSalesChannelId: Boolean(salesChannelId),
      currencyCode: currencyCode ?? null,
      payloadKeys:
        payload && typeof payload === "object" ? Object.keys(payload) : null,
    })
    throw new Error("Invalid transfer-to-medusa response")
  }

  if (promotionCodes.length > 0) {
    await sdk.store.cart.update(
      payload.medusa_cart_id,
      { promo_codes: promotionCodes },
      {},
      await getAuthHeaders()
    )
  }

  return payload.medusa_cart_id
}

export async function checkoutFromCustomerCart(
  input: TransferToMedusaInput & {
    countryCode?: string
    promotionCodes?: string[]
  }
): Promise<never> {
  const medusaCartId = await transferCustomerCartItemsToMedusa(input)

  await setCartId(medusaCartId)

  const redirectPath = input.countryCode
    ? `/${input.countryCode}/checkout`
    : "/checkout"

  redirect(redirectPath)
}

export async function checkoutCustomerCartSelection(
  selectedLineItemIds: string[],
  options?: { countryCode?: string; promotionCodes?: string[] }
): Promise<never> {
  if (!selectedLineItemIds.length) {
    throw new Error("No items selected for checkout")
  }

  const countryCode = options?.countryCode
  const promotionCodes = options?.promotionCodes ?? []

  const fallbackRedirectPath = countryCode
    ? `/${countryCode}/checkout`
    : "/checkout"

  // On the customer-cart backed cart page, the \"line item\" IDs passed in are
  // already customer cart item IDs, because `getCartForCustomerCartPage`
  // builds a cart-like structure directly from `/store/customer-cart/items`.
  //
  // So we can pass them straight through to checkoutFromCustomerCart without
  // going through a Medusa cart bridge.
  let customerItems

  try {
    customerItems = await listCustomerCartItemsInCart()
  } catch (error: any) {
    const status = error?.status ?? error?.cause?.status
    const statusText = error?.statusText ?? error?.cause?.statusText

    // If the user is not authenticated against the Medusa store (no JWT),
    // the customer-cart endpoints respond with 401. In that case we can't
    // use the customer-cart bridge and should fall back to the regular
    // Medusa checkout flow instead of throwing.
    if (status === 401 || statusText === "Unauthorized") {
      // Ensure there is a Medusa cart (and cartId cookie) for the guest
      // checkout flow so that `/[locale]/checkout` has a cart to work with.
      if (countryCode) {
        try {
          await getOrSetCart(countryCode)
        } catch (e) {
          console.error(
            "[checkoutCustomerCartSelection] Failed to create Medusa cart for guest:",
            e
          )
        }
      }

      redirect(fallbackRedirectPath)
    }

    throw error
  }

  if (!customerItems.length) {
    redirect(fallbackRedirectPath)
  }

  const selectedCustomerItems = customerItems.filter((item) =>
    selectedLineItemIds.includes(item.id)
  )

  if (!selectedCustomerItems.length) {
    redirect(countryCode ? `/${countryCode}/checkout` : "/checkout")
  }

  // We don't yet have region/sales channel context on the customer cart itself,
  // so we keep using the current Medusa cart (if any) just to infer these
  // values for the transfer endpoint.
  const cartId = await getCartId()
  const cart = cartId ? await retrieveCart(cartId) : null

  return checkoutFromCustomerCart({
    customerCartItemIds: selectedCustomerItems.map((item) => item.id),
    regionId: cart?.region_id,
    salesChannelId: cart?.sales_channel_id ?? undefined,
    currencyCode: cart?.currency_code ?? undefined,
    countryCode,
    promotionCodes,
  })
}

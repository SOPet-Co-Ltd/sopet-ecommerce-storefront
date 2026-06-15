"use server"

import { fetchQuery, sdk } from "../config"
import medusaError from "@/lib/helpers/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidatePath, revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getOrderIdFromPlaceOrderResponse } from "@/lib/helpers/place-order-response"
import { parseVariantIdsFromError } from "@/lib/helpers/parse-variant-error"
import { Cart } from "@/types/cart"
import type { MpCheckoutV1 } from "@/types/marketplace-checkout"
import { listProducts } from "./products"
import { checkoutLineFingerprint } from "@/lib/helpers/checkout-line-fingerprint"
import { getCheckoutCartFetchTimeoutMs } from "@/lib/helpers/request-timeout"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"
import { buildThankYouPath } from "@/lib/helpers/checkout-redirect"

const checkoutPerfLog =
  process.env["CHECKOUT_PERF_LOG"] === "1" ||
  process.env["CHECKOUT_PERF_LOG"] === "true"

function logCheckoutPerf(phase: string, ms: number) {
  if (checkoutPerfLog) {
    console.info(`[checkout-perf] ${phase} ${ms.toFixed(1)}ms`)
  }
}

async function cleanupCustomerCartItemsFromCheckoutMetadata(cart: unknown) {
  const metadata =
    cart && typeof cart === "object" && "metadata" in cart
      ? ((cart as { metadata?: Record<string, unknown> | null }).metadata ??
        null)
      : null

  const itemIds = Array.isArray(metadata?.customer_cart_item_ids)
    ? metadata.customer_cart_item_ids.filter(
        (value): value is string =>
          typeof value === "string" && value.length > 0
      )
    : []

  if (!itemIds.length) {
    return
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await Promise.all(
    itemIds.map((itemId) =>
      fetchQuery(`/store/customer-cart/items/${itemId}`, {
        method: "DELETE",
        headers,
        cache: "no-store",
      }).catch(() => null)
    )
  )
}

/**
 * On checkout enter: cap each line item quantity at variant inventory.
 * Fetches product/variant inventory and updates any item that exceeds max.
 */
export async function ensureCheckoutCartQuantitiesCapped(
  cart: Cart
): Promise<{ cart: Cart; mutated: boolean }> {
  const items = cart?.items ?? []
  if (!items.length || !cart.region_id) return { cart, mutated: false }

  const productIds = Array.from(
    new Set(
      items
        .map((i) => i.product_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  )
  if (!productIds.length) return { cart, mutated: false }

  let products: Array<{
    variants?: Array<{ id: string; inventory_quantity?: number }> | null
  }> = []
  try {
    const result = await listProducts({
      regionId: cart.region_id,
      queryParams: {
        id: productIds,
        limit: productIds.length,
        fields: "id,*variants,+variants.inventory_quantity",
      },
      forceCache: false,
      includeStats: false,
    })
    products = (result?.response?.products ?? []) as typeof products
  } catch {
    return { cart, mutated: false }
  }

  const variantToMax = new Map<string, number>()
  for (const p of products) {
    for (const v of p.variants ?? []) {
      const inv = v.inventory_quantity
      if (typeof inv === "number" && inv >= 0) {
        variantToMax.set(v.id, inv)
      }
    }
  }

  const updates: { lineId: string; quantity: number; variantId?: string }[] = []
  for (const item of items) {
    const vid = item.variant_id
    if (!vid) continue
    const max = variantToMax.get(vid)
    if (typeof max !== "number") continue
    const qty = Number(item.quantity) || 0
    if (qty > max) {
      updates.push({
        lineId: item.id,
        quantity: max,
        variantId: vid,
      })
    }
  }

  if (!updates.length) return { cart, mutated: false }

  try {
    await Promise.all(
      updates.map((u) =>
        updateLineItem({
          lineId: u.lineId,
          quantity: u.quantity,
          variantId: u.variantId,
        })
      )
    )
    const next = await retrieveCart(cart.id)
    if (!next) {
      console.warn(
        "[ensureCheckoutCartQuantitiesCapped] retrieveCart returned null after cap; skipping client refresh to avoid checkout 404"
      )
      return { cart, mutated: false }
    }
    return { cart: next, mutated: true }
  } catch {
    return { cart, mutated: false }
  }
}

/**
 * Runs quantity cap after checkout shell has rendered (non-blocking for TTFB).
 */
export async function runCheckoutCartQuantityCapFromCookie(): Promise<{
  mutated: boolean
  lineFingerprint: string
}> {
  const cart = await retrieveCart()
  if (!cart) {
    return { mutated: false, lineFingerprint: "" }
  }
  const { cart: nextCart, mutated } =
    await ensureCheckoutCartQuantitiesCapped(cart)
  return {
    mutated,
    lineFingerprint: checkoutLineFingerprint(nextCart),
  }
}

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string): Promise<Cart | null> {
  const tAll = performance.now()
  const id = cartId || (await getCartId())

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartUrl = `/store/carts/${id}?fields=*items.variant.options,+items.variant,*items,+items.adjustments,+items.product.seller,+promotions,+region,+metadata,+payment_collection,+payment_collection.payment_sessions,+items.variant_title,+shipping_methods.adjustments,+customer`

  const fetchCart = () =>
    fetchQuery(cartUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      medusaTimeoutMs: getCheckoutCartFetchTimeoutMs(),
    })

  const tCart = performance.now()
  let result = await fetchCart()
  if (result.error || !result.data?.cart) {
    const retryable =
      result.status === 0 ||
      result.status === 408 ||
      result.status === 429 ||
      (result.status >= 500 && result.status < 600)
    if (retryable) {
      await new Promise((r) => setTimeout(r, 500))
      result = await fetchCart()
    }
  }
  logCheckoutPerf("retrieveCart:GET_cart", performance.now() - tCart)

  if (result.error || !result.data?.cart) {
    console.error(`[retrieveCart] Error fetching cart ${id}:`, result.error)
    return null
  }

  const cart = result.data.cart as Cart

  const needsSellerFetch = (cart.items || []).some((item) => {
    const row = item as {
      product_id?: string
      product?: { id?: string; seller?: unknown }
    }
    const pid = row.product_id || row.product?.id
    if (!pid) return false
    return !row.product?.seller
  })

  if (needsSellerFetch) {
    const tSeller = performance.now()
    try {
      const productIds = [
        ...new Set(
          (cart.items || [])
            .map((item) => {
              const row = item as {
                product_id?: string
                product?: { id?: string }
              }
              return row.product_id || row.product?.id
            })
            .filter(Boolean)
        ),
      ] as string[]

      if (productIds.length > 0) {
        const { products: sellerProducts } = await sdk.client.fetch<{
          products: Array<{
            id: string
            seller?: { id: string; name: string }
          }>
        }>(`/store/products`, {
          method: "GET",
          query: {
            id: productIds,
            fields: "*seller",
            limit: productIds.length,
          },
          headers,
          cache: "no-store",
        })

        const sellerMap = new Map<string, { id: string; name: string }>()
        for (const p of sellerProducts || []) {
          if (p.seller) sellerMap.set(p.id, p.seller)
        }
        for (const item of cart.items || []) {
          const row = item as {
            product_id?: string
            product?: { id?: string; seller?: { id: string; name: string } }
          }
          const pid = row.product_id || row.product?.id
          if (pid && sellerMap.has(pid)) {
            if (!row.product) row.product = {}
            row.product.seller = sellerMap.get(pid)!
          }
        }
      }
    } catch (e) {
      console.warn("[retrieveCart] Failed to enrich seller data:", e)
    }
    logCheckoutPerf("retrieveCart:seller_enrich", performance.now() - tSeller)
  }

  logCheckoutPerf("retrieveCart:total", performance.now() - tAll)
  return cart
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  const salesChannelId =
    process.env.NEXT_PUBLIC_MEDUSA_SALES_CHANNEL_ID ||
    process.env.MEDUSA_SALES_CHANNEL_ID

  let cart = await retrieveCart()

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const cartResp = await sdk.client.fetch<{ cart: Cart }>("/store/cart", {
      method: "POST",
      body: {
        region_id: region.id,
        currency_code: region.currency_code,
        ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
      },
      headers,
    })
    cart = cartResp.cart as Cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart) {
    const updateData: HttpTypes.StoreUpdateCart = {}

    if (cart.region_id !== region.id) {
      updateData.region_id = region.id
    }

    if (salesChannelId && cart.sales_channel_id !== salesChannelId) {
      updateData.sales_channel_id = salesChannelId
    }

    if (Object.keys(updateData).length > 0) {
      await sdk.store.cart.update(cart.id, updateData, {}, headers)
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    }
  }

  return cart
}

/**
 * Guest checkout: create a Medusa cart via the dedicated guest-cart endpoint
 * and redirect to checkout. Call this after removing selected items from the
 * anonymous cart so only non-selected items remain for restore on back-nav.
 */
export async function createGuestMedusaCart(
  selectedItems: { variantId: string; quantity: number }[],
  countryCode: string,
  promotionCodes: string[] = []
): Promise<never> {
  const email = `guest-${Date.now()}@sopet.org`

  const res = await fetchQuery("/store/guest-cart/create-medusa", {
    method: "POST",
    body: {
      items: selectedItems.map((i) => ({
        variant_id: i.variantId,
        quantity: i.quantity,
      })),
      email,
      promotion_codes: promotionCodes,
    },
  })

  if (!res.ok || !res.data?.medusa_cart_id) {
    throw new Error(
      res.error?.message || "Failed to create guest checkout cart"
    )
  }

  await setCartId(res.data.medusa_cart_id)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  redirect(`/${countryCode}/checkout`)
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return await sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }) => {
      const cartCacheTag = await getCacheTag("carts")
      await revalidateTag(cartCacheTag)
      return cart
    })
    .catch(medusaError)
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  productId,
}: {
  variantId: string
  quantity: number
  countryCode: string
  productId?: string
}) {
  if (!variantId) {
    throw new Error("Missing variant ID when adding to cart")
  }

  const cart = await getOrSetCart(countryCode)

  if (!cart) {
    throw new Error("Error retrieving or creating cart")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const currentItem = cart.items?.find((item) => item.variant_id === variantId)

  if (currentItem) {
    await sdk.store.cart
      .updateLineItem(
        cart.id,
        currentItem.id,
        { quantity: currentItem.quantity + quantity },
        {},
        headers
      )
      .catch(medusaError)
      .finally(async () => {
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
      })
  } else {
    await sdk.store.cart
      .createLineItem(
        cart.id,
        {
          variant_id: variantId,
          quantity,
        },
        {},
        headers
      )
      .then(async () => {
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
        if (productId) {
          const { trackProductEvent } = await import("./product-events")
          trackProductEvent({
            event_type: "add_to_cart",
            product_id: productId,
            variant_id: variantId,
          })
        }
      })
      .catch(medusaError)
      .finally(async () => {
        const cartCacheTag = await getCacheTag("carts")
        revalidateTag(cartCacheTag)
      })
  }
}

export async function updateLineItem({
  lineId,
  quantity,
  variantId,
}: {
  lineId: string
  quantity: number
  variantId?: string
}) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when updating line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when updating line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const cartBefore = await retrieveCart(cartId)
    const previousProviderId =
      cartBefore?.payment_collection?.payment_sessions?.[0]?.provider_id

    const body: Record<string, unknown> = { quantity }

    if (variantId) {
      body.variant_id = variantId
    }

    const res = await fetchQuery(
      `/store/carts/${cartId}/line-items/${lineId}`,
      {
        body,
        method: "POST",
        headers,
      }
    )

    if (previousProviderId) {
      const updatedCart = await retrieveCart(cartId)
      if (
        updatedCart?.payment_collection &&
        (!updatedCart.payment_collection.payment_sessions ||
          updatedCart.payment_collection.payment_sessions.length === 0)
      ) {
        await initiatePaymentSession(updatedCart, {
          provider_id: previousProviderId,
        }).catch((e) => console.warn("Auto re-initiate failed", e))
      }
    }

    const cartCacheTag = await getCacheTag("carts")
    await revalidateTag(cartCacheTag)

    return res
  } catch (e: any) {
    const errorMessage = e?.message || ""
    if (
      errorMessage.includes("Could not delete all payment sessions") ||
      errorMessage.includes("payment collection")
    ) {
      console.warn(
        "[updateLineItem] Cart is locked by payment session. User needs to reset or complete order.",
        e
      )
      throw new Error(
        "Cannot modify cart because payment is processed. Please complete the order or start a new cart."
      )
    }
    console.error(`[updateLineItem] Error updating line item ${lineId}:`, e)
    throw e
  }
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartBefore = await retrieveCart(cartId)
  const previousProviderId =
    cartBefore?.payment_collection?.payment_sessions?.[0]?.provider_id

  await fetchQuery(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
    headers,
  })

  if (previousProviderId) {
    const updatedCart = await retrieveCart(cartId)
    if (
      updatedCart?.payment_collection &&
      (!updatedCart.payment_collection.payment_sessions ||
        updatedCart.payment_collection.payment_sessions.length === 0)
    ) {
      await initiatePaymentSession(updatedCart, {
        provider_id: previousProviderId,
      }).catch((e) => console.warn("Auto re-initiate failed", e))
    }
  }

  const cartCacheTag = await getCacheTag("carts")
  await revalidateTag(cartCacheTag)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await fetchQuery(`/store/carts/${cartId}/shipping-methods`, {
    body: { option_id: shippingMethodId },
    method: "POST",
    headers,
  })

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  return res
}

export async function setMultiShippingMethods(
  {
    cartId,
    optionIds,
  }: {
    cartId: string
    optionIds: string[]
  },
  options?: {
    skipCacheRevalidate?: boolean
  }
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await fetchQuery(
    `/store/carts/${cartId}/multi-shipping-methods`,
    {
      body: { option_ids: optionIds },
      method: "POST",
      headers,
    }
  )

  if (!options?.skipCacheRevalidate) {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return res
}

export async function initiatePaymentSession(
  cart: Cart,
  data: {
    provider_id: string
    data?: Record<string, unknown>
    context?: Record<string, unknown>
  }
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const sessionData = data.data || data.context

  // If cart already has a payment collection, we must add a session to it
  // instead of trying to create a new collection (which throws 500)
  if (cart.payment_collection?.id) {
    return fetchQuery(
      `/store/payment-collections/${cart.payment_collection.id}/payment-sessions`,
      {
        method: "POST",
        body: {
          provider_id: data.provider_id,
          ...(sessionData ? { data: sessionData } : {}),
        },
        headers,
      }
    ).then(async (res) => {
      if (!res.ok) {
        throw new Error(
          res.error?.message || "Failed to initiate payment session"
        )
      }
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return res.data
    })
  }

  return sdk.store.payment
    .initiatePaymentSession(
      cart as unknown as HttpTypes.StoreCart,
      {
        provider_id: data.provider_id,
        ...(sessionData ? { data: sessionData } : {}),
      },
      {},
      headers
    )
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function prepareMarketplacePayments(
  cartId: string,
  options?: { skipCacheRevalidate?: boolean }
): Promise<MpCheckoutV1> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await fetchQuery(
    `/store/carts/${cartId}/marketplace-payments/prepare`,
    {
      method: "POST",
      headers,
    }
  )

  if (!res.ok || !res.data) {
    throw new Error(
      res.error?.message || "Failed to prepare marketplace checkout"
    )
  }

  const mp = (res.data as { marketplace_checkout?: MpCheckoutV1 })
    .marketplace_checkout
  if (!mp || mp.version !== 1 || !mp.slices?.length) {
    throw new Error("Invalid marketplace checkout response")
  }

  if (!options?.skipCacheRevalidate) {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return mp
}

export async function createMarketplacePaymentSession(
  cartId: string,
  input: {
    payment_collection_id: string
    provider_id: string
    data?: Record<string, unknown>
  },
  options?: { skipCacheRevalidate?: boolean }
): Promise<HttpTypes.StorePaymentCollection> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await fetchQuery(
    `/store/carts/${cartId}/marketplace-payments/payment-sessions`,
    {
      method: "POST",
      headers,
      body: {
        payment_collection_id: input.payment_collection_id,
        provider_id: input.provider_id,
        ...(input.data ? { data: input.data } : {}),
      },
    }
  )

  if (!res.ok || !res.data) {
    throw new Error(
      res.error?.message || "Failed to create marketplace payment session"
    )
  }

  const pc = (
    res.data as { payment_collection?: HttpTypes.StorePaymentCollection }
  ).payment_collection
  if (!pc?.id) {
    throw new Error("Invalid marketplace payment session response")
  }

  if (!options?.skipCacheRevalidate) {
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return pc
}

export async function bootstrapMarketplacePaymentSessions(
  cartId: string,
  input: {
    provider_id: string
    data?: Record<string, unknown>
  }
): Promise<{
  marketplaceCheckout: MpCheckoutV1
  collectionsById: Record<string, HttpTypes.StorePaymentCollection>
}> {
  const marketplaceCheckout = await prepareMarketplacePayments(cartId, {
    skipCacheRevalidate: true,
  })

  const entries = await Promise.all(
    marketplaceCheckout.slices.map(async (slice) => {
      const collection = await createMarketplacePaymentSession(
        cartId,
        {
          payment_collection_id: slice.payment_collection_id,
          provider_id: input.provider_id,
          ...(input.data ? { data: input.data } : {}),
        },
        { skipCacheRevalidate: true }
      )
      return [slice.payment_collection_id, collection] as const
    })
  )

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  return {
    marketplaceCheckout,
    collectionsById: Object.fromEntries(entries),
  }
}

/**
 * Completes checkout for marketplace carts (per-seller payment collections).
 */
/** Clear Medusa cart cookie after a successful checkout (e.g. PromptPay full-page flow). */
export async function clearCheckoutCartCookie() {
  await removeCartId()
}

export async function completeMarketplaceOrder(
  cartId?: string,
  options?: {
    redirect?: boolean
    requirePaid?: boolean
    providerId?: string
    paymentMethodType?: "card" | "promptpay"
    paymentSessionIds?: string[]
    paymentIntentIds?: string[]
    locale?: string
    cartSnapshot?: {
      customerId?: string | null
      email?: string | null
      customerPhone?: string | null
      customerEmail?: string | null
      promotionCodes?: string[] | null
    }
  }
) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartSnapshot = options?.cartSnapshot
  let cartBeforeComplete:
    | {
        customer_id?: string | null
        email?: string | null
        customer?: { phone?: string | null; email?: string | null } | null
        promotions?: { code?: string }[]
      }
    | Cart
    | null = cartSnapshot
    ? {
        customer_id: cartSnapshot.customerId ?? null,
        email: cartSnapshot.email ?? null,
        customer: {
          phone: cartSnapshot.customerPhone ?? null,
          email: cartSnapshot.customerEmail ?? null,
        },
        promotions:
          cartSnapshot.promotionCodes?.map((code) => ({ code })) ?? undefined,
      }
    : null

  if (!cartBeforeComplete?.customer_id && !cartBeforeComplete?.email) {
    cartBeforeComplete = await retrieveCart(id)
  }

  if (!cartBeforeComplete?.email) {
    const customerPhone =
      cartSnapshot?.customerPhone ||
      (cartBeforeComplete as { customer?: { phone?: string } })?.customer?.phone
    const customerEmail =
      cartSnapshot?.customerEmail ||
      (cartBeforeComplete as { customer?: { email?: string } })?.customer?.email
    const fallbackEmail = customerPhone
      ? `${customerPhone}@sopet.org`
      : customerEmail || "no-reply@sopet.org"

    await updateCart({ email: fallbackEmail })
    cartBeforeComplete = {
      ...cartBeforeComplete,
      email: fallbackEmail,
    }
  }

  if (
    !Array.isArray(
      (
        cartBeforeComplete as {
          metadata?: { customer_cart_item_ids?: unknown }
        }
      )?.metadata?.customer_cart_item_ids
    )
  ) {
    const hydratedCart = await retrieveCart(id)
    if (hydratedCart) {
      cartBeforeComplete = hydratedCart
    }
  }

  const res = await fetchQuery(
    `/store/carts/${id}/marketplace-payments/complete`,
    {
      body:
        options?.requirePaid ||
        options?.providerId ||
        options?.paymentMethodType ||
        options?.paymentSessionIds?.length ||
        options?.paymentIntentIds?.length
          ? {
              ...(options?.requirePaid ? { require_paid: true } : {}),
              ...(options?.providerId
                ? { provider_id: options.providerId }
                : {}),
              ...(options?.paymentMethodType
                ? { payment_method_type: options.paymentMethodType }
                : {}),
              ...(options?.paymentSessionIds?.length
                ? { payment_session_ids: options.paymentSessionIds }
                : {}),
              ...(options?.paymentIntentIds?.length
                ? { payment_intent_ids: options.paymentIntentIds }
                : {}),
            }
          : undefined,
      method: "POST",
      headers,
    }
  )

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const orderId = getOrderIdFromPlaceOrderResponse(res)
  const appliedPromoCodes =
    cartSnapshot?.promotionCodes?.filter(Boolean) ||
    ((cartBeforeComplete as { promotions?: { code?: string }[] })?.promotions
      ?.map((p) => p.code)
      .filter(Boolean) as string[] | undefined)
  if (res?.ok && appliedPromoCodes?.length) {
    const { markCouponAsUsed } = await import("@/lib/data/coupons")
    Promise.all(appliedPromoCodes.map((code) => markCouponAsUsed(code))).catch(
      (err) => console.error("Error marking coupons as used:", err)
    )
  }
  if (res?.ok) {
    await cleanupCustomerCartItemsFromCheckoutMetadata(cartBeforeComplete)
    revalidatePath("/user/reviews")
    revalidatePath("/user/orders")
  }
  if (orderId && options?.redirect !== false) {
    removeCartId()
    redirect(buildThankYouPath(options?.locale ?? "th", orderId))
  }

  return res
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.store.cart.update(cartId, { promo_codes: codes }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)

    const updatedCart = await fetchQuery(`/store/carts/${cartId}`, {
      method: "GET",
      headers,
      cache: "no-store",
      query: {
        fields: "+promotions",
      },
    })

    const applied = (
      (updatedCart.data as { cart?: { promotions?: { code?: string }[] } })
        ?.cart?.promotions ?? []
    ).some((promotion) => promotion.code && codes.includes(promotion.code))

    return !!applied
  } catch (err) {
    console.error("[applyPromotions] Error applying promotion:", err)
    return false
  }
}

export async function removeShippingMethod(shippingMethodId: string) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  return fetch(
    `${process.env.MEDUSA_BACKEND_URL}/store/carts/${cartId}/shipping-methods`,
    {
      method: "DELETE",
      body: JSON.stringify({ shipping_method_ids: [shippingMethodId] }),
      headers,
    }
  )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function deletePromotionCode(promoId: string) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  return fetch(
    `${process.env.MEDUSA_BACKEND_URL}/store/carts/${cartId}/promotions`,
    {
      method: "DELETE",
      body: JSON.stringify({ promo_codes: [promoId] }),
      headers,
    }
  )
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const normalizedEntries = new Map<string, FormDataEntryValue>()
    for (const [key, value] of formData.entries()) {
      if (key === "0") {
        continue
      }
      const normalizedKey = key.replace(/^\d+_/, "")
      if (!normalizedEntries.has(normalizedKey)) {
        normalizedEntries.set(normalizedKey, value)
      }
    }

    const getField = (field: string) => normalizedEntries.get(field) ?? null

    const getText = (field: string, fallback = "") => {
      const value = getField(field)
      return typeof value === "string" ? value : fallback
    }

    const data: HttpTypes.StoreUpdateCart = {
      shipping_address: {
        first_name: getText("shipping_address.first_name"),
        last_name: getText("shipping_address.last_name"),
        address_1: getText("shipping_address.address_1"),
        address_2: getText("shipping_address.address_2"),
        company: getText("shipping_address.company"),
        postal_code: getText("shipping_address.postal_code"),
        city: getText("shipping_address.city"),
        country_code: getText("shipping_address.country_code"),
        province: getText("shipping_address.province"),
        phone: normalizeThaiPhoneNumber(getText("shipping_address.phone")),
      },
    }

    let email = getText("email") || getText("shipping_address.email")

    if (!email) {
      const cartId = await getCartId()
      if (cartId) {
        const cart = await retrieveCart(cartId)
        const customer = (cart as any)?.customer
        if (customer?.phone) {
          email = `${customer.phone}@sopet.org`
        } else if (customer?.email) {
          email = customer.email
        }
      }
    }

    if (!email) {
      email = "no-reply@sopet.org"
    }

    data.email = email

    // Note: Only set billing_address when a separate billing form is provided.

    await updateCart(data)

    await revalidatePath("/cart")
  } catch (e: unknown) {
    return (e as Error).message
  }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The response; use getOrderIdFromPlaceOrderResponse(res) to get the order ID.
 */
export async function placeOrder(
  cartId?: string,
  options?: { redirect?: boolean; locale?: string }
) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  // Ensure cart data is available before completing the order
  let cartBeforeComplete = await retrieveCart(id)

  if (!cartBeforeComplete?.email) {
    // Force a fallback email if missing to bypass Medusa v2 requirement
    // Use customer's phone if available for better identification
    const customerPhone = (cartBeforeComplete as any)?.customer?.phone
    const fallbackEmail = customerPhone
      ? `${customerPhone}@sopet.org`
      : "no-reply@sopet.org"

    await updateCart({ email: fallbackEmail })
  }

  const res = await fetchQuery(`/store/carts/${id}/complete`, {
    method: "POST",
    headers,
  })

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const orderId = getOrderIdFromPlaceOrderResponse(res)
  if (res?.data?.order_set) {
    const appliedPromoCodes = (cartBeforeComplete as any)?.promotions
      ?.map((p: any) => p.code)
      .filter(Boolean) as string[] | undefined
    if (appliedPromoCodes && appliedPromoCodes.length > 0) {
      const { markCouponAsUsed } = await import("@/lib/data/coupons")
      Promise.all(
        appliedPromoCodes.map((code) => markCouponAsUsed(code))
      ).catch((err) => console.error("Error marking coupons as used:", err))
    }
  }
  if (res?.ok) {
    await cleanupCustomerCartItemsFromCheckoutMetadata(cartBeforeComplete)
    revalidatePath("/user/reviews")
    revalidatePath("/user/orders")
  }
  if (orderId && options?.redirect !== false) {
    removeCartId()
    redirect(buildThankYouPath(options?.locale ?? "th", orderId))
  }

  return res
}

/**
 * Clears the cart on Medusa (deletes all line items) and removes the local cart cookie.
 * Call when closing QR payment modal or when navigating away from checkout.
 */
export async function clearCart() {
  const cartId = await getCartId()
  if (cartId) {
    try {
      const cart = await retrieveCart(cartId)
      const headers = await getAuthHeaders()
      const lineIds = (cart?.items ?? []).map((item) => item.id).filter(Boolean)
      for (const lineId of lineIds) {
        await fetchQuery(`/store/carts/${cartId}/line-items/${lineId}`, {
          method: "DELETE",
          headers,
        }).catch(() => {})
      }
      const cartCacheTag = await getCacheTag("carts")
      await revalidateTag(cartCacheTag)
    } catch {
      // Cart may already be completed or missing; still clear cookie
    }
  }
  removeCartId()
  // Cart tag + caller `router.refresh()` update the UI. Avoid `revalidatePath("/")`
  // here — it invalidates the whole tree and can amplify PDP/RSC refetch storms.
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

/**
 * Updates the region and returns removed items for notification
 * This is a wrapper around updateRegion that doesn't redirect
 * Uses error-driven approach: tries to update, catches price errors, removes problem items, retries
 * @param countryCode - The country code to update to
 * @param currentPath - The current path for redirect
 * @returns Array of removed item names and new path
 */
export async function updateRegionWithValidation(
  countryCode: string,
  currentPath: string
): Promise<{ removedItems: string[]; newPath: string }> {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let removedItems: string[] = []

  if (cartId) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    try {
      await updateCart({ region_id: region.id })
    } catch (error: unknown) {
      if (!(error as Error)?.message?.includes("do not have a price")) {
        throw error
      }

      const problematicVariantIds = parseVariantIdsFromError(
        (error as Error).message
      )

      if (!problematicVariantIds.length) {
        throw new Error("Failed to parse variant IDs from error")
      }

      try {
        const { cart } = await sdk.client.fetch<HttpTypes.StoreCartResponse>(
          `/store/carts/${cartId}`,
          {
            method: "GET",
            query: {
              fields: "*items",
            },
            headers,
            cache: "no-cache",
          }
        )

        for (const variantId of problematicVariantIds) {
          const item = cart?.items?.find(
            (item) => item.variant_id === variantId
          )
          if (item) {
            try {
              await sdk.store.cart.deleteLineItem(
                cart.id,
                item.id,
                { fields: "*" },
                headers
              )
              removedItems.push(item.product_title || "Unknown product")
            } catch (deleteError) {}
          }
        }

        if (removedItems.length > 0) {
          await updateCart({ region_id: region.id })
        }
      } catch (fetchError) {
        throw new Error("Failed to handle incompatible cart items")
      }
    }

    // Revalidate caches
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  return {
    removedItems,
    newPath: `/${countryCode}${currentPath}`,
  }
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}

export async function checkoutWithSelection(selectedItemIds: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const cart = await retrieveCart(cartId)
  if (!cart?.items) {
    redirect("/checkout")
    return
  }

  const itemsToDelete = cart.items.filter(
    (item) => !selectedItemIds.includes(item.id) && item.variant_id
  )

  if (itemsToDelete.length > 0) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    // Save hidden items to metadata
    const hiddenItems = itemsToDelete.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    }))

    await sdk.store.cart.update(
      cartId,
      { metadata: { hidden_items: hiddenItems } },
      {},
      headers
    )

    await Promise.all(
      itemsToDelete.map((item) =>
        sdk.store.cart
          .deleteLineItem(cartId, item.id, {}, headers)
          .then(() => {})
          .catch((err) => {
            console.error(`Failed to delete item ${item.id}`, err)
          })
      )
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  redirect("/checkout")
}

export async function restoreHiddenItems(): Promise<boolean> {
  const cartId = await getCartId()
  if (!cartId) return false

  const cart = await retrieveCart(cartId)
  const hidden = (cart?.metadata?.hidden_items as any[]) || []

  if (hidden.length > 0) {
    const headers = {
      ...(await getAuthHeaders()),
    }

    const results = await Promise.all(
      hidden.map(async (item) => {
        try {
          await sdk.store.cart.createLineItem(
            cartId,
            { variant_id: item.variant_id, quantity: item.quantity },
            {},
            headers
          )
          return { item, ok: true }
        } catch (err) {
          console.error(
            `[restoreHiddenItems] Failed to restore item ${item.variant_id}`,
            err
          )
          return { item, ok: false }
        }
      })
    )

    const remainingHidden = results.filter((r) => !r.ok).map((r) => r.item)

    if (remainingHidden.length !== hidden.length) {
      await sdk.store.cart
        .update(
          cartId,
          { metadata: { hidden_items: remainingHidden } },
          {},
          headers
        )
        .then(() => {})
        .catch(console.error)
    }

    return remainingHidden.length !== hidden.length
  }

  return false
}

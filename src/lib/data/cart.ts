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
import { parseVariantIdsFromError } from "@/lib/helpers/parse-variant-error"
import { Cart } from "@/types/cart"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string): Promise<Cart | null> {
  const id = cartId || (await getCartId())

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const { data, error } = await fetchQuery(
    `/store/carts/${id}?fields=+items,+region,+payment_collection,+payment_collection.payment_sessions`,
    {
      method: "GET",
      headers,
      cache: "no-store",
    }
  )

  if (error || !data?.cart) {
    console.error(`[retrieveCart] Error fetching cart ${id}:`, error)
    return null
  }

  return data.cart as Cart
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
}: {
  variantId: string
  quantity: number
  countryCode: string
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
}: {
  lineId: string
  quantity: number
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
    const res = await fetchQuery(
      `/store/carts/${cartId}/line-items/${lineId}`,
      {
        body: { quantity },
        method: "POST",
        headers,
      }
    )

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

  await fetchQuery(`/store/cart/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
    headers,
  })
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      await revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
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

export async function initiatePaymentSession(
  cart: Cart,
  data: {
    provider_id: string
    context?: Record<string, unknown>
  }
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(
      cart as unknown as HttpTypes.StoreCart,
      data,
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

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async ({ cart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      // @ts-ignore
      const applied = cart.promotions?.some((promotion: any) =>
        codes.includes(promotion.code)
      )
      return applied
    })
    .catch(medusaError)
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
        phone: getText("shipping_address.phone"),
      },
    }

    const email = getText("email")
    if (email) {
      data.email = email
    }

    // const sameAsBilling = formData.get("same_as_billing")
    // if (sameAsBilling === "on") data.billing_address = data.shipping_address
    data.billing_address = data.shipping_address as HttpTypes.StoreCartAddress

    // if (sameAsBilling !== "on")
    //   data.billing_address = {
    //     first_name: formData.get("billing_address.first_name"),
    //     last_name: formData.get("billing_address.last_name"),
    //     address_1: formData.get("billing_address.address_1"),
    //     address_2: "",
    //     company: formData.get("billing_address.company"),
    //     postal_code: formData.get("billing_address.postal_code"),
    //     city: formData.get("billing_address.city"),
    //     country_code: formData.get("billing_address.country_code"),
    //     province: formData.get("billing_address.province"),
    //     phone: formData.get("billing_address.phone"),
    //   }

    await updateCart(data)
    await revalidatePath("/cart")
  } catch (e: unknown) {
    return (e as Error).message
  }
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const res = await fetchQuery(`/store/carts/${id}/complete`, {
    method: "POST",
    headers,
  })

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  if (res?.data?.order_set) {
    revalidatePath("/user/reviews")
    revalidatePath("/user/orders")
    removeCartId()
    redirect(`/order/${res?.data?.order_set.orders[0].id}/confirmed`)
  }

  return res
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
  console.log(
    `[checkoutWithSelection] Starting for cartId: ${cartId}, selected:`,
    selectedItemIds
  )

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const cart = await retrieveCart(cartId)
  if (!cart?.items) {
    console.log("[checkoutWithSelection] No items in cart, redirecting")
    redirect("/checkout")
    return
  }

  const itemsToDelete = cart.items.filter(
    (item) => !selectedItemIds.includes(item.id) && item.variant_id
  )

  console.log(
    `[checkoutWithSelection] Items to delete/hide: ${itemsToDelete.length}`
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

    console.log(
      "[checkoutWithSelection] Saving hidden items to metadata:",
      JSON.stringify(hiddenItems)
    )

    await sdk.store.cart.update(
      cartId,
      { metadata: { hidden_items: hiddenItems } },
      {},
      headers
    )

    console.log(
      "[checkoutWithSelection] Metadata saved successfully. Proceeding to delete items."
    )

    await Promise.all(
      itemsToDelete.map((item) =>
        sdk.store.cart
          .deleteLineItem(cartId, item.id, {}, headers)
          .then(() =>
            console.log(`[checkoutWithSelection] Deleted item ${item.id}`)
          )
          .catch((err) => {
            console.error(`Failed to delete item ${item.id}`, err)
          })
      )
    )

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  console.log("[checkoutWithSelection] Redirecting to checkout")
  redirect("/checkout")
}

export async function restoreHiddenItems(): Promise<boolean> {
  const cartId = await getCartId()
  if (!cartId) return false

  const cart = await retrieveCart(cartId)
  const hidden = (cart?.metadata?.hidden_items as any[]) || []

  console.log(
    `[restoreHiddenItems] CartId: ${cartId}, Found hidden items:`,
    hidden.length,
    JSON.stringify(hidden)
  )

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
          console.log(`[restoreHiddenItems] Restored item ${item.variant_id}`)
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
        .then(() =>
          console.log(
            `[restoreHiddenItems] Metadata updated. Remaining hidden: ${remainingHidden.length}`
          )
        )
        .catch(console.error)
    }

    return remainingHidden.length !== hidden.length
  }

  return false
}

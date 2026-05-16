"use server"

import { sdk } from "@/lib/config"
import { HttpTypes } from "@medusajs/types"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { StoreCardShippingMethod } from "@/types/cart"

export const listVendorShippingMethods = async (
  cartId: string,
  sellerId: string
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<{
      shipping_options: StoreCardShippingMethod[] | null
      seller_id?: string
      seller_name?: string | null
    }>(`/store/shipping-options/vendor`, {
      method: "GET",
      query: {
        cart_id: cartId,
        seller_id: sellerId,
      },
      headers,
      next,
      cache: "no-cache",
    })
    .then(({ shipping_options }) => shipping_options ?? [])
    .catch((error) => {
      console.error("[listVendorShippingMethods] Error:", error)
      return null
    })
}

export const listCartShippingMethods = async (
  cartId: string,
  is_return: boolean = false
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  return sdk.client
    .fetch<{ shipping_options: StoreCardShippingMethod[] | null }>(
      `/store/shipping-options`,
      {
        method: "GET",
        query: {
          cart_id: cartId,
          fields:
            "+service_zone.fulfillment_set.type,*service_zone.fulfillment_set.location.address",
        },
        headers,
        next,
        cache: "no-cache",
      }
    )
    .then(({ shipping_options }) => {
      return shipping_options
    })
    .catch((error) => {
      console.error("[listCartShippingMethods] Error:", error)
      return null
    })
}

export const calculatePriceForShippingOption = async (
  optionId: string,
  cartId: string,
  data?: Record<string, unknown>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("fulfillment")),
  }

  const body = { cart_id: cartId, data }

  if (data) {
    body.data = data
  }

  return sdk.client
    .fetch<{ shipping_option: HttpTypes.StoreCartShippingOption }>(
      `/store/shipping-options/${optionId}/calculate`,
      {
        method: "POST",
        body,
        headers,
        next,
      }
    )
    .then(({ shipping_option }) => shipping_option)
    .catch((e) => {
      return null
    })
}

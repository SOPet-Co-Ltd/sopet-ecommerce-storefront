"use server"

import { SellerProps } from "@/types/seller"
import { sdk } from "../config"
import medusaError from "../helpers/medusa-error"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import { HttpTypes } from "@medusajs/types"

export const retrieveOrderSet = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<any>(`/store/order-set/${id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then(({ order_set }) => order_set)
    .catch((err) => medusaError(err))
}

export const retrieveOrder = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse & { seller: SellerProps }>(
      `/store/orders/${id}`,
      {
        method: "GET",
        query: {
          fields:
            "*payment_collections.payments,*payment_collections.payment_sessions,*items,*items.metadata,*items.variant,*items.product,*seller,*order_set",
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ order }) => order)
    .catch((err) => medusaError(err))
}

export const createReturnRequest = async (data: any) => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  const response = await fetch(
    `${process.env.MEDUSA_BACKEND_URL}/store/return-request`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    }
  )
    .then(async (res) => await res.json())
    .catch((err) => medusaError(err))

  return response
}

export const getReturns = async () => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{
      order_return_requests: Array<any>
    }>(`/store/return-request`, {
      method: "GET",
      headers,
      cache: "force-cache",
      query: { fields: "*line_items.reason_id" },
    })
    .then((res) => res)
    .catch((err) => medusaError(err))
}

export const retriveReturnMethods = async (order_id: string) => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{
      shipping_options: Array<any>
    }>(`/store/shipping-options/return?order_id=${order_id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then(({ shipping_options }) => shipping_options)
    .catch(() => [])
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, any>
) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<{
      orders: Array<
        HttpTypes.StoreOrder & {
          seller: { id: string; name: string; reviews?: any[] }
          reviews: any[]
        }
      >
    }>(`/store/custom/orders`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*payment_collections.payment_sessions,*items,*items.metadata,*items.variant,*items.product,*seller,*order_set",
        limit,
        offset,
        take: limit,
        skip: offset,
        ...filters,
      },
      headers,
      next,
      cache: "no-cache",
    })
    .then(({ orders }) => orders)
    .catch((err) => medusaError(err))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const retrieveReturnReasons = async () => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{
      return_reasons: Array<HttpTypes.StoreReturnReason>
    }>(`/store/return-reasons`, {
      method: "GET",
      headers,
      cache: "force-cache",
    })
    .then(({ return_reasons }) => return_reasons)
    .catch((err) => medusaError(err))
}

export const cancelOrder = async (id: string) => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{ order: any }>(`/store/custom/orders/${id}/cancel`, {
      method: "POST",
      headers,
    })
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => {
      console.error("Cancel order error:", err)
      return { success: false, error: err.message, order: null }
    })
}

export const updateOrderPaymentSession = async (
  orderId: string,
  providerId: string,
  amountToPay?: number
) => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<{ payment_session: any }>(
      `/store/orders/${orderId}/payment-session`,
      {
        method: "POST",
        headers,
        body: { provider_id: providerId, amount: amountToPay },
      }
    )
    .then(async ({ payment_session }) => {
      // Revalidate order cache so the new session is visible on reload
      const { revalidateTag } = require("next/cache")
      const cacheTag = await getCacheTag("orders")
      if (cacheTag) revalidateTag(cacheTag)
      revalidateTag("orders")

      return {
        success: true,
        error: null,
        payment_session,
      }
    })
    .catch((err) => {
      console.error("Update payment session error:", err)
      return { success: false, error: err.message, payment_session: null }
    })
}

export const captureOrderPayment = async (orderId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  return sdk.client
    .fetch<{ order: any }>(`/store/custom/orders/${orderId}/capture`, {
      method: "POST",
      headers,
    })
    .then(async ({ order }) => {
      const { revalidateTag } = require("next/cache")
      const cacheTag = await getCacheTag("orders")
      if (cacheTag) revalidateTag(cacheTag)
      revalidateTag("orders")
      return {
        success: true,
        error: null,
        order,
      }
    })
    .catch((err) => {
      console.error("Capture order payment error:", err)
      return { success: false, error: err.message, order: null }
    })
}

export const completeOrder = async (orderId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  try {
    const { order } = await sdk.client.fetch<{ order: any }>(
      `/store/custom/orders/${orderId}/complete`,
      {
        method: "POST",
        headers,
      }
    )

    const { revalidateTag } = require("next/cache")
    const cacheTag = await getCacheTag("orders")
    if (cacheTag) revalidateTag(cacheTag)
    revalidateTag("orders")

    return {
      success: true,
      error: null,
      order,
    }
  } catch (err: any) {
    console.error("Complete order error:", err)
    return {
      success: false,
      error: err?.message ?? "Unknown error",
      order: null,
    }
  }
}

export const retrievePaymentCollection = async (id: string) => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": process.env
      .NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY as string,
  }

  // Payment collections might need to be fetched via the region or order,
  // but let's try the direct store API if it exists. If it returned 404, it might be /store/payment-collections is invalid.
  // Actually, in Medusa V2, we should probably fetch the order again but specifically request the payment_sessions.
  // We tried that, but it didn't work. Let's try fetching the cart instead if it's linked, or bypassing it
  // by creating a custom route in the backend to fetch the payment collection.

  // Let's create a custom route in the backend in a moment if needed.
  // For now, let's just use the custom route we will create: /store/custom/payment-collections/${id}
  return sdk.client
    .fetch<{ payment_collection: any }>(`/custom/payment-collections/${id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then(({ payment_collection }) => payment_collection)
    .catch((err) => {
      console.error("Retrieve payment collection error:", err)
      return null
    })
}

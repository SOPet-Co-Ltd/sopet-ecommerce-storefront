"use server"

import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import type { ZodType, ZodTypeDef } from "zod"

import {
  createReturnRequestResponseSchema,
  getReturnsResponseSchema,
  listOrdersResponseSchema,
  orderSchema,
  orderMutationResponseSchema,
  retrieveCustomerPaymentMethodsResponseSchema,
  retrieveOrderResponseSchema,
  retrieveOrderSetResponseSchema,
  retrievePaymentCollectionResponseSchema,
  retrieveReturnMethodsResponseSchema,
  retrieveReturnReasonsResponseSchema,
  updateOrderPaymentSessionResponseSchema,
} from "../schemas/orders"
import { sdk } from "../config"
import medusaError from "../helpers/medusa-error"
import { getAuthHeaders, getCacheOptions, getCacheTag } from "./cookies"
import type {
  CreateReturnRequestInput,
  CreateReturnRequestResult,
  CustomerPaymentMethod,
  OrderDetails,
  OrderFilters,
  OrderListItem,
  OrderMutationOrder,
  OrderMutationResult,
  OrderPaymentCollection,
  OrderPaymentSession,
  UpdateOrderPaymentSessionMutationResult,
  OrderSetReference,
  ReturnReason,
  ReturnShippingMethod,
} from "@/types/order"

type RetrieveOrderSetResponse = { order_set: OrderSetReference }
type RetrieveOrderResponse = { order: OrderDetails }
type ListOrdersResponse = { orders: OrderListItem[] }
type RetrieveReturnReasonsResponse = { return_reasons: ReturnReason[] }
type RetrieveReturnMethodsResponse = {
  shipping_options: ReturnShippingMethod[]
}
type RetrievePaymentCollectionResponse = {
  payment_collection: OrderPaymentCollection
}
type UpdateOrderPaymentSessionResponse = {
  payment_session: OrderPaymentSession
  payment_sessions?: OrderPaymentSession[] | undefined
  order_id?: string
  payment_collection_ids?: string[]
}
type RetrieveCustomerPaymentMethodsResponse = {
  payment_methods: CustomerPaymentMethod[]
}

type UnknownRecord = Record<string, unknown>

const parseWithSchema = <T>(
  schema: ZodType<T, ZodTypeDef, unknown>,
  payload: unknown,
  context: string
): T => {
  const result = schema.safeParse(payload)

  if (!result.success) {
    console.error(
      `[orders] Invalid ${context} response`,
      result.error.flatten()
    )
    const message = getMessageFromPayload(payload)
    throw new Error(message ?? `Invalid ${context} response`)
  }

  return result.data
}

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Unknown error"
}

const getMessageFromPayload = (payload: unknown): string | null => {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  if (!("message" in payload)) {
    return null
  }

  const message = (payload as { message?: unknown }).message
  return typeof message === "string" ? message : null
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null

const parseOrdersListPayload = (payload: unknown): OrderListItem[] => {
  const parsedList = listOrdersResponseSchema.safeParse(payload)

  if (parsedList.success) {
    return parsedList.data.orders as unknown as OrderListItem[]
  }

  console.error(
    "[orders] Invalid listOrders response, attempting per-order recovery",
    parsedList.error.flatten()
  )

  const rawOrders = isRecord(payload) && Array.isArray(payload.orders)
    ? payload.orders
    : []

  const recoveredOrders: OrderListItem[] = []

  rawOrders.forEach((rawOrder, index) => {
    const parsedOrder = orderSchema.safeParse(rawOrder)

    if (parsedOrder.success) {
      recoveredOrders.push(parsedOrder.data as OrderListItem)
      return
    }

    console.error(
      `[orders] Skipping invalid order at index ${index}`,
      parsedOrder.error.flatten()
    )
  })

  return recoveredOrders
}

const parseOrderPayload = (payload: unknown): OrderDetails => {
  const parsed = retrieveOrderResponseSchema.safeParse(payload)

  if (parsed.success) {
    return parsed.data.order as unknown as OrderDetails
  }

  console.error(
    "[orders] Invalid retrieveOrder response, attempting direct order recovery",
    parsed.error.flatten()
  )

  const rawOrder = isRecord(payload) ? payload.order : undefined
  const parsedOrder = orderSchema.safeParse(rawOrder)

  if (parsedOrder.success) {
    return parsedOrder.data as OrderDetails
  }

  const message =
    getMessageFromPayload(payload) ?? "Invalid retrieveOrder response"
  throw new Error(message)
}

const revalidateOrdersCache = async () => {
  const cacheTag = await getCacheTag("orders")
  if (cacheTag) {
    revalidateTag(cacheTag)
  }
  revalidateTag("orders")
}

const getPublishableKey = (): string =>
  (process.env["NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"] ?? "").trim()

const getBackendUrl = (): string =>
  (process.env["MEDUSA_BACKEND_URL"] ?? "").trim()

export const verifyOrdersCustomer = async (): Promise<boolean> => {
  const headers = await getAuthHeaders()

  if (Object.keys(headers).length === 0) {
    return false
  }

  try {
    await sdk.client.fetch<unknown>("/store/auth/me", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    return true
  } catch {
    return false
  }
}

export const retrieveOrderSet = async (
  id: string
): Promise<OrderSetReference> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<unknown>(`/store/order-set/${id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then((response) =>
      parseWithSchema<RetrieveOrderSetResponse>(
        retrieveOrderSetResponseSchema,
        response,
        "retrieveOrderSet"
      )
    )
    .then(({ order_set }) => order_set)
    .catch((error) => medusaError(error))
}

export const retrieveOrder = async (id: string): Promise<OrderDetails> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<unknown>(`/store/custom/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*payment_collections.payment_sessions,*items,*items.metadata,*items.variant,*items.variant.product,*items.variant.product.seller,*seller,*order_set,*fulfillments,*fulfillments.items,*fulfillments.labels",
      },
      headers,
      cache: "no-store",
    })
    .then((response) => parseOrderPayload(response))
    .catch((error) => medusaError(error))
}

export const createReturnRequest = async (
  data: CreateReturnRequestInput
): Promise<CreateReturnRequestResult> => {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key": getPublishableKey(),
  }

  const backendUrl = getBackendUrl()
  if (!backendUrl) {
    throw new Error("Missing MEDUSA_BACKEND_URL")
  }

  const response = await fetch(`${backendUrl}/store/return-request`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      getMessageFromPayload(payload) ??
      `Failed to create return request (${response.status})`
    throw new Error(message)
  }

  return parseWithSchema(
    createReturnRequestResponseSchema as ZodType<CreateReturnRequestResult>,
    payload,
    "createReturnRequest"
  )
}

export const getReturns = async (): Promise<{
  order_return_requests: unknown[]
}> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<unknown>(`/store/return-request`, {
      method: "GET",
      headers,
      cache: "force-cache",
      query: { fields: "*line_items.reason_id" },
    })
    .then((response) =>
      parseWithSchema(getReturnsResponseSchema, response, "getReturns")
    )
    .catch((error) => medusaError(error))
}

export const retriveReturnMethods = async (
  order_id: string
): Promise<ReturnShippingMethod[]> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<unknown>(`/store/shipping-options/return?order_id=${order_id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then((response) =>
      parseWithSchema<RetrieveReturnMethodsResponse>(
        retrieveReturnMethodsResponseSchema,
        response,
        "retriveReturnMethods"
      )
    )
    .then(({ shipping_options }) => shipping_options)
    .catch(() => [])
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: OrderFilters
): Promise<OrderListItem[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("orders")),
  }

  return sdk.client
    .fetch<unknown>(`/store/custom/orders`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*payment_collections.payment_sessions,*items,*items.metadata,*items.variant,*items.variant.product,*items.variant.product.seller,*seller,*order_set,*fulfillments,*fulfillments.items,*fulfillments.labels",
        limit,
        offset,
        ...(filters ?? {}),
      },
      headers,
      next,
      cache: "no-cache",
    })
    .then((response) => parseOrdersListPayload(response))
    .catch((error) => medusaError(error))
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
  const id = formData.get("order_id")

  if (typeof id !== "string" || !id) {
    return { success: false, error: "Order ID is required", order: null }
  }

  const headers = await getAuthHeaders()

  const _state = state
  void _state

  return sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((error: unknown) => ({
      success: false,
      error: toErrorMessage(error),
      order: null,
    }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((error: unknown) => ({
      success: false,
      error: toErrorMessage(error),
      order: null,
    }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((error: unknown) => ({
      success: false,
      error: toErrorMessage(error),
      order: null,
    }))
}

export const retrieveReturnReasons = async (): Promise<ReturnReason[]> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<unknown>(`/store/return-reasons`, {
      method: "GET",
      headers,
      cache: "force-cache",
    })
    .then((response) =>
      parseWithSchema<RetrieveReturnReasonsResponse>(
        retrieveReturnReasonsResponseSchema,
        response,
        "retrieveReturnReasons"
      )
    )
    .then(({ return_reasons }) => return_reasons)
    .catch((error) => medusaError(error))
}

export const cancelOrder = async (
  id: string
): Promise<OrderMutationResult<OrderMutationOrder, "order">> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<unknown>(`/store/custom/orders/${id}/cancel`, {
      method: "POST",
      headers,
    })
    .then((response) =>
      parseWithSchema(orderMutationResponseSchema, response, "cancelOrder")
    )
    .then(async ({ order }) => {
      await revalidateOrdersCache()
      return {
        success: true as const,
        error: null,
        order,
      }
    })
    .catch((error: unknown) => {
      console.error("Cancel order error:", error)
      return {
        success: false as const,
        error: toErrorMessage(error),
        order: null,
      }
    })
}

export const updateOrderPaymentSession = async (
  orderId: string,
  providerId: string,
  amountToPay?: number
): Promise<UpdateOrderPaymentSessionMutationResult> => {
  const headers = await getAuthHeaders()

  return sdk.client
    .fetch<unknown>(`/store/orders/${orderId}/payment-session`, {
      method: "POST",
      headers,
      body: { provider_id: providerId, amount: amountToPay },
    })
    .then((response) =>
      parseWithSchema<UpdateOrderPaymentSessionResponse>(
        updateOrderPaymentSessionResponseSchema,
        response,
        "updateOrderPaymentSession"
      )
    )
    .then(
      async ({
        payment_session,
        payment_sessions,
        order_id,
        payment_collection_ids,
      }) => {
        await revalidateOrdersCache()

        const paymentSessions = payment_sessions?.length
          ? payment_sessions
          : [payment_session]

        return {
          success: true as const,
          error: null,
          payment_session,
          payment_sessions: paymentSessions,
          ...(order_id ? { order_id } : {}),
          ...(payment_collection_ids?.length ? { payment_collection_ids } : {}),
        }
      }
    )
    .catch((error: unknown) => {
      console.error("Update payment session error:", error)
      return {
        success: false as const,
        error: toErrorMessage(error),
        payment_session: null,
        payment_sessions: null,
      }
    })
}

export const captureOrderPayment = async (
  orderId: string
): Promise<OrderMutationResult<OrderMutationOrder, "order">> => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": getPublishableKey(),
  }

  return sdk.client
    .fetch<unknown>(`/store/custom/orders/${orderId}/capture`, {
      method: "POST",
      headers,
    })
    .then((response) =>
      parseWithSchema(
        orderMutationResponseSchema,
        response,
        "captureOrderPayment"
      )
    )
    .then(async ({ order }) => {
      await revalidateOrdersCache()

      return {
        success: true as const,
        error: null,
        order,
      }
    })
    .catch((error: unknown) => {
      console.error("Capture order payment error:", error)
      return {
        success: false as const,
        error: toErrorMessage(error),
        order: null,
      }
    })
}

export const completeOrder = async (
  orderId: string
): Promise<OrderMutationResult<OrderMutationOrder, "order">> => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": getPublishableKey(),
  }

  try {
    const response = await sdk.client.fetch<unknown>(
      `/store/custom/orders/${orderId}/complete`,
      {
        method: "POST",
        headers,
      }
    )

    const { order } = parseWithSchema(
      orderMutationResponseSchema,
      response,
      "completeOrder"
    )

    await revalidateOrdersCache()

    return {
      success: true,
      error: null,
      order,
    }
  } catch (error: unknown) {
    console.error("Complete order error:", error)
    return {
      success: false,
      error: toErrorMessage(error),
      order: null,
    }
  }
}

export const retrievePaymentCollection = async (
  id: string
): Promise<OrderPaymentCollection | null> => {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key": getPublishableKey(),
  }

  return sdk.client
    .fetch<unknown>(`/custom/payment-collections/${id}`, {
      method: "GET",
      headers,
      cache: "no-cache",
    })
    .then((response) =>
      parseWithSchema<RetrievePaymentCollectionResponse>(
        retrievePaymentCollectionResponseSchema,
        response,
        "retrievePaymentCollection"
      )
    )
    .then(({ payment_collection }) => payment_collection)
    .catch((error: unknown) => {
      console.error("Retrieve payment collection error:", error)
      return null
    })
}

export async function getOrderCustomerPaymentMethods(): Promise<
  | { success: true; paymentMethods: CustomerPaymentMethod[] }
  | { success: false; error: string }
> {
  const headers = await getAuthHeaders()

  if (Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const response = await sdk.client.fetch<unknown>(
      "/store/customers/me/payment-methods",
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    )

    const { payment_methods } =
      parseWithSchema<RetrieveCustomerPaymentMethodsResponse>(
        retrieveCustomerPaymentMethodsResponseSchema,
        response,
        "getOrderCustomerPaymentMethods"
      )

    return { success: true, paymentMethods: payment_methods }
  } catch (error: unknown) {
    return { success: false, error: toErrorMessage(error) }
  }
}

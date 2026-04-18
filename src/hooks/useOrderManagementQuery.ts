"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  UpdateOrderPaymentSessionMutationResult,
} from "@/types/order"
import { queryKeys } from "@/lib/react-query/query-keys"
import {
  cancelOrder,
  captureOrderPayment,
  completeOrder,
  updateOrderPaymentSession,
} from "@/lib/data/orders"
import type {
  OrderDetailsPageBundleData,
  OrdersPageBundleData,
} from "@/lib/data/order-management-page"

type UseOrdersListQueryOptions = {
  limit?: number
  offset?: number
  initialData?: OrdersPageBundleData
}

type UseOrderDetailsQueryOptions = {
  orderId: string
  initialData?: OrderDetailsPageBundleData
}

type OrderMutationInput = {
  orderId: string
}

type UpdateOrderPaymentSessionInput = {
  orderId: string
  providerId: string
  amountToPay?: number
}

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchOrdersList(
  limit: number,
  offset: number
): Promise<OrdersPageBundleData> {
  const response = await fetch(
    `/api/orders?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
    {
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดรายการคำสั่งซื้อได้")
  }

  return parseJson<OrdersPageBundleData>(response)
}

async function fetchOrderDetails(
  orderId: string
): Promise<OrderDetailsPageBundleData> {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้")
  }

  return parseJson<OrderDetailsPageBundleData>(response)
}

async function invalidateOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId?: string
) {
  await queryClient.invalidateQueries({
    queryKey: queryKeys.orders.all(),
  })

  if (orderId) {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.orders.detail(orderId),
    })
  }

  await queryClient.invalidateQueries({
    queryKey: queryKeys.notifications.all(),
  })
}

export function useOrdersListQuery({
  limit = 100,
  offset = 0,
  initialData,
}: UseOrdersListQueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(limit, offset),
    queryFn: () => fetchOrdersList(limit, offset),
    initialData,
    staleTime: 30 * 1000,
  })
}

export function useOrderDetailsQuery({
  orderId,
  initialData,
}: UseOrderDetailsQueryOptions) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrderDetails(orderId),
    initialData,
    enabled: Boolean(orderId),
    staleTime: 30 * 1000,
  })
}

export function useOrderManagementInvalidation() {
  const queryClient = useQueryClient()

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.orders.all(),
    })
  }
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId }: OrderMutationInput) => cancelOrder(orderId),
    onSuccess: async (result, variables) => {
      if (!result.success) {
        return
      }

      await invalidateOrderQueries(queryClient, variables.orderId)
    },
  })
}

export function useCompleteOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId }: OrderMutationInput) => completeOrder(orderId),
    onSuccess: async (result, variables) => {
      if (!result.success) {
        return
      }

      await invalidateOrderQueries(queryClient, variables.orderId)
    },
  })
}

export function useCaptureOrderPaymentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId }: OrderMutationInput) =>
      captureOrderPayment(orderId),
    onSuccess: async (result, variables) => {
      if (!result.success) {
        return
      }

      await invalidateOrderQueries(queryClient, variables.orderId)
    },
  })
}

export function useUpdateOrderPaymentSessionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      providerId,
      amountToPay,
    }: UpdateOrderPaymentSessionInput): Promise<UpdateOrderPaymentSessionMutationResult> =>
      updateOrderPaymentSession(orderId, providerId, amountToPay),
    onSuccess: async (_result, variables) => {
      await invalidateOrderQueries(queryClient, variables.orderId)
    },
  })
}

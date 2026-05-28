"use server"

import { fetchQuery } from "../config"
import { getAuthHeaders } from "./cookies"

export type CheckoutSessionPaymentMethod = "card" | "promptpay"

export type CheckoutSessionStatus =
  | "pending"
  | "awaiting_payment"
  | "captured"
  | "failed"
  | "expired"

export type CheckoutSessionPaymentCollection = {
  id: string
  payment_sessions?: Array<Record<string, unknown>>
  payments?: Array<Record<string, unknown>>
}

export interface CheckoutSessionDto {
  id: string
  customer_id: string | null
  cart_id: string
  region_id: string | null
  payment_method: CheckoutSessionPaymentMethod
  order_id: string | null
  payment_collection_ids: string[] | null
  payment_session_ids: string[] | null
  payment_collections: CheckoutSessionPaymentCollection[]
  saved_card_id: string | null
  omise_token: string | null
  status: CheckoutSessionStatus
  expires_at: string | null
  failure_reason?: string | null
  failure_code?: string | null
  payload: Record<string, unknown>
}

export type CreateCheckoutSessionInput = {
  payload: Record<string, unknown>
}

/** Persist the checkout snapshot before handing payment off to /payment/[id]. */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const headers = { ...(await getAuthHeaders()) }

  const res = await fetchQuery("/store/checkout-sessions", {
    method: "POST",
    headers,
    body: input,
    cache: "no-store",
  })

  if (!res.ok) {
    return {
      ok: false,
      message: res.error?.message ?? "ไม่สามารถบันทึกข้อมูลการชำระเงินได้",
    }
  }

  const data = res.data as { id?: string } | null
  if (!data?.id) {
    return { ok: false, message: "ไม่พบรหัสการชำระเงิน" }
  }
  return { ok: true, id: data.id }
}

/** Server-side fetch used by the payment page. */
export async function getCheckoutSession(
  id: string
): Promise<
  | { ok: true; session: CheckoutSessionDto }
  | { ok: false; status: number; message: string }
> {
  const headers = { ...(await getAuthHeaders()) }

  const res = await fetchQuery(`/store/checkout-sessions/${id}`, {
    method: "GET",
    headers,
    cache: "no-store",
  })

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: res.error?.message ?? "ไม่พบข้อมูลการชำระเงิน",
    }
  }

  return { ok: true, session: res.data as CheckoutSessionDto }
}

/** Mark the session as captured/failed once the payment page finishes its work. */
export async function setCheckoutSessionStatus(
  id: string,
  status: "captured" | "failed",
  details?: { failure_reason?: string | null; failure_code?: string | null }
): Promise<{ ok: boolean; message?: string }> {
  const headers = { ...(await getAuthHeaders()) }

  const body: Record<string, unknown> = { status }
  if (status === "failed") {
    if (details?.failure_reason) body.failure_reason = details.failure_reason
    if (details?.failure_code) body.failure_code = details.failure_code
  }

  const res = await fetchQuery(`/store/checkout-sessions/${id}`, {
    method: "POST",
    headers,
    body,
    cache: "no-store",
  })

  if (!res.ok) {
    return {
      ok: false,
      message: res.error?.message ?? "ไม่สามารถอัปเดตสถานะได้",
    }
  }
  return { ok: true }
}

/** Attach the order + payment session ids created on the payment page. */
export async function attachCheckoutSessionOrder(input: {
  id: string
  order_id: string
  payment_collection_ids?: string[]
  payment_session_ids?: string[]
}): Promise<{ ok: boolean; message?: string }> {
  const headers = { ...(await getAuthHeaders()) }

  const res = await fetchQuery(`/store/checkout-sessions/${input.id}`, {
    method: "POST",
    headers,
    body: {
      status: "awaiting_payment",
      order_id: input.order_id,
      payment_collection_ids: input.payment_collection_ids,
      payment_session_ids: input.payment_session_ids,
    },
    cache: "no-store",
  })

  if (!res.ok) {
    return {
      ok: false,
      message: res.error?.message ?? "ไม่สามารถบันทึกคำสั่งซื้อได้",
    }
  }
  return { ok: true }
}

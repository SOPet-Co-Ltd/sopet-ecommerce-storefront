"use server"

import type { HttpTypes } from "@medusajs/types"
import { fetchQuery } from "../config"
import {
  getCheckoutCustomer,
  getCustomerPaymentMethods,
  type CustomerPaymentMethod,
} from "./customer"
import { getAuthHeaders } from "./cookies"
import { listCartShippingMethods } from "./fulfillment"
import { listCartPaymentMethods } from "./payment"
import type { StoreCardShippingMethod } from "@/types/cart"

export type CouponData = {
  id: unknown
  code: unknown
  title: string
  description: string
  conditions: string
  category: string
  discount_value: string
  min_purchase: unknown
  expiry_date: string
  image_color: unknown
  status: unknown
  vendorName: string | null
  source: "vendor" | "site"
  created_at: string | null
  is_collected: boolean
  is_used: boolean
  is_eligible: boolean
  ineligibility_reason: string | null
}

export type PromotionsPayload = {
  site: CouponData[]
  vendor: CouponData[]
}

export type CheckoutPageBundleData = {
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  customerAddresses: HttpTypes.StoreCustomerAddress[]
  customerCards: CustomerPaymentMethod[]
  sitePromos: CouponData[]
  vendorPromos: CouponData[]
  error: string | null
}

export type CheckoutPageInitialData = CheckoutPageBundleData

type CheckoutPageBundleResponse = {
  shipping_methods?: StoreCardShippingMethod[] | null
  payment_methods?: HttpTypes.StorePaymentProvider[] | null
  customer?: HttpTypes.StoreCustomer | null
  customer_cards?: CustomerPaymentMethod[] | null
  promotions?: PromotionsPayload | null
  error?: string | null
}

export async function getCheckoutPageInitialData(
  cartId: string,
  regionId: string | null | undefined,
  options?: {
    customerPromise?: Promise<HttpTypes.StoreCustomer | null>
  }
): Promise<CheckoutPageInitialData> {
  return getCheckoutPageBundleData(cartId, regionId, options)
}

async function fetchSitePromos(cartId: string): Promise<CouponData[]> {
  const headers = { ...(await getAuthHeaders()) }
  const response = await fetchQuery("/store/coupons/site", {
    method: "GET",
    query: { cart_id: cartId },
    headers,
    cache: "no-store",
  })
  if (!response.ok) return []
  const data = response.data as { coupons?: CouponData[] } | null
  return data?.coupons ?? []
}

async function fetchVendorPromos(cartId: string): Promise<CouponData[]> {
  const headers = { ...(await getAuthHeaders()) }
  const response = await fetchQuery("/store/coupons/vendor", {
    method: "GET",
    query: { cart_id: cartId },
    headers,
    cache: "no-store",
  })
  if (!response.ok) return []
  const data = response.data as { coupons?: CouponData[] } | null
  return data?.coupons ?? []
}

export async function getCheckoutPageBundleData(
  cartId: string,
  regionId: string | null | undefined,
  options?: {
    customerPromise?: Promise<HttpTypes.StoreCustomer | null>
  }
): Promise<CheckoutPageBundleData> {
  const settled = await Promise.allSettled([
    listCartShippingMethods(cartId, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    options?.customerPromise ?? getCheckoutCustomer(),
    fetchSitePromos(cartId),
    fetchVendorPromos(cartId),
    getCustomerPaymentMethods(),
  ])

  const [
    shippingRes,
    providersRes,
    customerRes,
    sitePromosRes,
    vendorPromosRes,
    customerCardsRes,
  ] = settled

  const shippingMethods =
    shippingRes.status === "fulfilled" ? (shippingRes.value ?? []) : []
  const paymentMethods =
    providersRes.status === "fulfilled" ? providersRes.value : null
  const customer = customerRes.status === "fulfilled" ? customerRes.value : null
  const sitePromos =
    sitePromosRes.status === "fulfilled" ? sitePromosRes.value : []
  const vendorPromos =
    vendorPromosRes.status === "fulfilled" ? vendorPromosRes.value : []
  const customerCards =
    customerCardsRes.status === "fulfilled" && customerCardsRes.value.success
      ? customerCardsRes.value.paymentMethods
      : []

  let error: string | null = null
  if (shippingRes.status === "rejected") {
    error =
      (shippingRes.reason as Error)?.message ??
      "ไม่สามารถโหลดตัวเลือกการจัดส่งได้"
  } else if (customerRes.status === "rejected") {
    error =
      (customerRes.reason as Error)?.message ?? "ไม่สามารถโหลดข้อมูลบัญชีได้"
  }

  return {
    shippingMethods,
    paymentMethods,
    customer,
    customerAddresses: customer?.addresses ?? [],
    customerCards,
    sitePromos,
    vendorPromos,
    error,
  }
}

export async function getCheckoutPageBundleDataFromStoreApi(
  cartId: string,
  regionId: string | null | undefined
): Promise<CheckoutPageBundleData> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery("/store/checkout/page-data", {
    method: "GET",
    query: {
      cart_id: cartId,
      ...(regionId ? { region_id: regionId } : {}),
      include_promotions: "true",
    },
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return {
      shippingMethods: [],
      paymentMethods: null,
      customer: null,
      customerAddresses: [],
      customerCards: [],
      sitePromos: [],
      vendorPromos: [],
      error: response.error?.message ?? "ไม่สามารถโหลดข้อมูล checkout ได้",
    }
  }

  const payload = response.data as CheckoutPageBundleResponse | null
  const customer = payload?.customer ?? null

  return {
    shippingMethods: payload?.shipping_methods ?? [],
    paymentMethods: payload?.payment_methods ?? null,
    customer,
    customerAddresses: customer?.addresses ?? [],
    customerCards: payload?.customer_cards ?? [],
    sitePromos: payload?.promotions?.site ?? [],
    vendorPromos: payload?.promotions?.vendor ?? [],
    error: payload?.error ?? null,
  }
}

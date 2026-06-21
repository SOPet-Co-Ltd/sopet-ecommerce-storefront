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
import type { Cart, StoreCardShippingMethod } from "@/types/cart"
import type {
  CheckoutCoupon,
  CheckoutPromotionsPayload,
} from "@/types/checkout-coupon"
import { enrichCartWithSellerData } from "./enrich-cart-sellers"

/**
 * @deprecated Import `CheckoutCoupon` from `@/types/checkout-coupon` instead.
 * Kept as alias so legacy imports continue to compile.
 */
export type CouponData = CheckoutCoupon
export type PromotionsPayload = CheckoutPromotionsPayload

export type CheckoutPageBundleData = {
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  customerAddresses: HttpTypes.StoreCustomerAddress[]
  customerCards: CustomerPaymentMethod[]
  sitePromos: CheckoutCoupon[]
  vendorPromos: CheckoutCoupon[]
  cart: Cart | null
  promotionAutoApplyEnabled: boolean
  error: string | null
}

export type CheckoutPageInitialData = CheckoutPageBundleData

type CheckoutPageBundleResponse = {
  shipping_methods?: StoreCardShippingMethod[] | null
  payment_methods?: HttpTypes.StorePaymentProvider[] | null
  customer?: HttpTypes.StoreCustomer | null
  customer_cards?: CustomerPaymentMethod[] | null
  promotions?: PromotionsPayload | null
  cart?: Cart | null
  promotion_auto_apply_enabled?: boolean
  error?: string | null
}

export async function getCheckoutPageInitialData(
  cartId: string,
  regionId: string | null | undefined,
  _options?: {
    customerPromise?: Promise<HttpTypes.StoreCustomer | null>
  }
): Promise<CheckoutPageInitialData> {
  return getCheckoutPageBundleDataFromStoreApi(cartId, regionId)
}

const CHECKOUT_COUPON_PAGE_SIZE = 200

async function fetchSitePromos(cartId: string): Promise<CheckoutCoupon[]> {
  const headers = { ...(await getAuthHeaders()) }
  const response = await fetchQuery("/store/coupons/site", {
    method: "GET",
    query: { cart_id: cartId, take: CHECKOUT_COUPON_PAGE_SIZE, skip: 0 },
    headers,
    cache: "no-store",
  })
  if (!response.ok) return []
  const data = response.data as { coupons?: CheckoutCoupon[] } | null
  return data?.coupons ?? []
}

async function fetchVendorPromos(cartId: string): Promise<CheckoutCoupon[]> {
  const headers = { ...(await getAuthHeaders()) }
  const response = await fetchQuery("/store/coupons/vendor", {
    method: "GET",
    query: { cart_id: cartId, take: CHECKOUT_COUPON_PAGE_SIZE, skip: 0 },
    headers,
    cache: "no-store",
  })
  if (!response.ok) return []
  const data = response.data as { coupons?: CheckoutCoupon[] } | null
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
    cart: null,
    promotionAutoApplyEnabled: false,
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

  const [responseResult, customerCardsResult] = await Promise.allSettled([
    fetchQuery("/store/checkout/page-data", {
      method: "GET",
      query: {
        cart_id: cartId,
        ...(regionId ? { region_id: regionId } : {}),
        include_promotions: "true",
      },
      headers,
      cache: "no-store",
    }),
    getCustomerPaymentMethods(),
  ])

  const customerCards =
    customerCardsResult.status === "fulfilled" &&
    customerCardsResult.value.success
      ? customerCardsResult.value.paymentMethods
      : []

  if (responseResult.status === "rejected") {
    return {
      shippingMethods: [],
      paymentMethods: null,
      customer: null,
      customerAddresses: [],
      customerCards,
      sitePromos: [],
      vendorPromos: [],
      cart: null,
      promotionAutoApplyEnabled: false,
      error:
        (responseResult.reason as Error)?.message ??
        "ไม่สามารถโหลดข้อมูล checkout ได้",
    }
  }

  const response = responseResult.value

  if (!response.ok) {
    return {
      shippingMethods: [],
      paymentMethods: null,
      customer: null,
      customerAddresses: [],
      customerCards,
      sitePromos: [],
      vendorPromos: [],
      cart: null,
      promotionAutoApplyEnabled: false,
      error: response.error?.message ?? "ไม่สามารถโหลดข้อมูล checkout ได้",
    }
  }

  const payload = response.data as CheckoutPageBundleResponse | null
  const customer = payload?.customer ?? null
  const rawCart = payload?.cart ?? null
  const cart = rawCart ? await enrichCartWithSellerData(rawCart as Cart) : null

  return {
    shippingMethods: payload?.shipping_methods ?? [],
    paymentMethods: payload?.payment_methods ?? null,
    customer,
    customerAddresses: customer?.addresses ?? [],
    customerCards,
    sitePromos: payload?.promotions?.site ?? [],
    vendorPromos: payload?.promotions?.vendor ?? [],
    cart,
    promotionAutoApplyEnabled: payload?.promotion_auto_apply_enabled === true,
    error: payload?.error ?? null,
  }
}

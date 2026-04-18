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

export type CheckoutPageBundleData = {
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  error: string | null
}

export type CheckoutPageInitialData = CheckoutPageBundleData & {
  savedStripePaymentMethods: CustomerPaymentMethod[]
  savedStripePaymentMethodsLoaded: boolean
}

type CheckoutPageBundleResponse = {
  shipping_methods?: StoreCardShippingMethod[] | null
  payment_methods?: HttpTypes.StorePaymentProvider[] | null
  customer?: HttpTypes.StoreCustomer | null
  error?: string | null
}

const CHECKOUT_SAVED_CARDS_SSR_TIMEOUT_MS = 1500

async function getCheckoutSavedStripePaymentMethods(
  customer: HttpTypes.StoreCustomer | null
): Promise<{
  paymentMethods: CustomerPaymentMethod[]
  loaded: boolean
}> {
  if (!customer) {
    return {
      paymentMethods: [],
      loaded: true,
    }
  }

  try {
    const result = await Promise.race([
      getCustomerPaymentMethods().then((response) =>
        response.success
          ? {
              paymentMethods: response.paymentMethods,
              loaded: true,
            }
          : {
              paymentMethods: [] as CustomerPaymentMethod[],
              loaded: false,
            }
      ),
      new Promise<{
        paymentMethods: CustomerPaymentMethod[]
        loaded: boolean
      }>((resolve) =>
        setTimeout(
          () =>
            resolve({
              paymentMethods: [],
              loaded: false,
            }),
          CHECKOUT_SAVED_CARDS_SSR_TIMEOUT_MS
        )
      ),
    ])

    return result
  } catch {
    return {
      paymentMethods: [],
      loaded: false,
    }
  }
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
  ])

  const [shippingRes, providersRes, customerRes] = settled

  const shippingMethods =
    shippingRes.status === "fulfilled" ? (shippingRes.value ?? []) : []
  const paymentMethods =
    providersRes.status === "fulfilled" ? providersRes.value : null
  const customer = customerRes.status === "fulfilled" ? customerRes.value : null
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
    },
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return {
      shippingMethods: [],
      paymentMethods: null,
      customer: null,
      error: response.error?.message ?? "ไม่สามารถโหลดข้อมูล checkout ได้",
    }
  }

  const payload = response.data as CheckoutPageBundleResponse | null

  return {
    shippingMethods: payload?.shipping_methods ?? [],
    paymentMethods: payload?.payment_methods ?? null,
    customer: payload?.customer ?? null,
    error: payload?.error ?? null,
  }
}

export async function getCheckoutPageInitialData(
  cartId: string,
  regionId: string | null | undefined,
  options?: {
    customerPromise?: Promise<HttpTypes.StoreCustomer | null>
  }
): Promise<CheckoutPageInitialData> {
  const bundle = await getCheckoutPageBundleData(cartId, regionId, options)
  const savedCardsResult = await getCheckoutSavedStripePaymentMethods(
    bundle.customer
  )

  return {
    ...bundle,
    savedStripePaymentMethods: savedCardsResult.paymentMethods,
    savedStripePaymentMethodsLoaded: savedCardsResult.loaded,
  }
}

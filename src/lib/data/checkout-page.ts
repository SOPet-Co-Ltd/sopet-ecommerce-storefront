"use server"

import type { HttpTypes } from "@medusajs/types"
import {
  getCheckoutCustomer,
  getCustomerPaymentMethods,
  type CustomerPaymentMethod,
} from "./customer"
import { listCartShippingMethods } from "./fulfillment"
import { listCartPaymentMethods } from "./payment"
import type { StoreCardShippingMethod } from "@/types/cart"

export type CheckoutPageInitialData = {
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  customer: HttpTypes.StoreCustomer | null
  savedStripePaymentMethods: CustomerPaymentMethod[]
  savedStripePaymentMethodsLoaded: boolean
  error: string | null
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

export async function getCheckoutPageInitialData(
  cartId: string,
  regionId: string | null | undefined,
  options?: {
    customerPromise?: Promise<HttpTypes.StoreCustomer | null>
  }
): Promise<CheckoutPageInitialData> {
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
  const savedCardsResult = await getCheckoutSavedStripePaymentMethods(customer)

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
    savedStripePaymentMethods: savedCardsResult.paymentMethods,
    savedStripePaymentMethodsLoaded: savedCardsResult.loaded,
    error,
  }
}

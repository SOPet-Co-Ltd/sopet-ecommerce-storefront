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
  error: string | null
}

export async function getCheckoutPageInitialData(
  cartId: string,
  regionId: string | null | undefined
): Promise<CheckoutPageInitialData> {
  const settled = await Promise.allSettled([
    listCartShippingMethods(cartId, false),
    regionId ? listCartPaymentMethods(regionId) : Promise.resolve(null),
    getCheckoutCustomer(),
    getCustomerPaymentMethods(),
  ])

  const [shippingRes, providersRes, customerRes, pmRes] = settled

  const shippingMethods =
    shippingRes.status === "fulfilled" ? (shippingRes.value ?? []) : []
  const paymentMethods =
    providersRes.status === "fulfilled" ? providersRes.value : null
  const customer = customerRes.status === "fulfilled" ? customerRes.value : null
  const savedStripePaymentMethods =
    pmRes.status === "fulfilled" && pmRes.value.success
      ? pmRes.value.paymentMethods
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
    savedStripePaymentMethods,
    error,
  }
}

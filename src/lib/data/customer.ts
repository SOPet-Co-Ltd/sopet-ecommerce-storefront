"use server"

import { fetchQuery, sdk } from "../config"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheTag,
  getCartId,
  removeAuthToken,
  removeCartId,
  setAuthToken,
} from "./cookies"
import meta from "@/components/atoms/Autocomplete/Autocomplete.stories"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"
import type { AddressFormData } from "@/components/molecules/AddressForm/schema"

/**
 * Lightweight auth check for layout/header usage.
 * Returns basic customer identity without expanding orders/addresses.
 */
export async function getSessionCustomer(): Promise<HttpTypes.StoreCustomer | null> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return null
  }

  try {
    const result = await sdk.client.fetch<{
      customer: HttpTypes.StoreCustomer
    }>(`/store/auth/me`, {
      method: "GET",
      headers,
      cache: "no-store",
    })

    return result.customer
  } catch {
    return null
  }
}

/**
 * Verify that the current user is logged in using the custom /store/auth/me route.
 * Returns the customer on 200, or null if unauthorized / not logged in.
 */
export const verifyCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const headers = await getAuthHeaders()

    // No auth headers means there's no token; treat as not logged in.
    if (!headers || Object.keys(headers).length === 0) {
      return null
    }

    try {
      const result = await sdk.client.fetch<{
        customer: HttpTypes.StoreCustomer
      }>(`/store/auth/me`, {
        method: "GET",
        headers,
        query: {
          fields: "*orders,*addresses",
          relations: "*orders,*addresses",
        },
        cache: "no-store",
      })

      return result.customer
    } catch {
      // If the backend returns 401/404 or any error, treat as not logged in.
      return null
    }
  }

/**
 * Lighter customer payload for checkout (no order graph).
 */
export async function getCheckoutCustomer(): Promise<HttpTypes.StoreCustomer | null> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return null
  }

  try {
    const result = await sdk.client.fetch<{
      customer: HttpTypes.StoreCustomer
    }>(`/store/auth/me`, {
      method: "GET",
      headers,
      query: {
        fields: "*addresses",
        relations: "*addresses",
      },
      cache: "no-store",
    })

    return result.customer
  } catch {
    return null
  }
}

export const updateCustomer = async (body: HttpTypes.StoreUpdateCustomer) => {
  const normalizedBody = {
    ...body,
    ...(body.phone ? { phone: normalizeThaiPhoneNumber(body.phone) } : {}),
  }
  const headers = {
    ...(await getAuthHeaders()),
  }

  const updateRes = await sdk.store.customer
    .update(normalizedBody, {}, headers)
    .then(({ customer }) => customer)
    .catch((err) => {
      throw new Error(err.message)
    })

  const cacheTag = await getCacheTag("customers")
  revalidateTag(cacheTag)

  return updateRes
}

export type UpdateProfileInput = {
  name?: string
  birth_date?: string
}

/**
 * Update logged-in customer profile (name and/or date of birth).
 * Uses POST /store/customers/me/profile; data is stored in customer.metadata.
 */
export async function updateProfile(
  input: UpdateProfileInput
): Promise<
  | { success: true; customer: HttpTypes.StoreCustomer }
  | { success: false; error: string }
> {
  const headers = await getAuthHeaders()
  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await sdk.client.fetch<{
      customer: HttpTypes.StoreCustomer
    }>("/store/customers/me/profile", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: input,
    })
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    return { success: true, customer: result.customer }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

/**
 * Request OTP for adding or changing email/phone (logged-in user).
 * Uses POST /store/customers/me/request-otp. Does not create a new customer.
 * Body is sent by type so change-email always sends email, change-phone always sends phone.
 */
export async function requestOtpForUpdate(
  identifier: string,
  type: "email" | "phone"
): Promise<{ success: true } | { success: false; error: string }> {
  const headers = await getAuthHeaders()
  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  const body =
    type === "email"
      ? { email: identifier.trim() }
      : { phone: normalizeThaiPhoneNumber(identifier) }

  try {
    const res = await sdk.client.fetch<{ success: boolean; error?: string }>(
      "/store/customers/me/request-otp",
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body,
      }
    )
    if (!res.success) {
      return { success: false, error: res.error ?? "ไม่สามารถส่ง OTP ได้" }
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

export type VerifyOtpUpdateInput = {
  email?: string
  phone?: string
  otp: string
}

/**
 * Verify OTP and update logged-in customer's email or phone.
 * Uses POST /store/customers/me/verify-otp-update. Stores new JWT if returned.
 */
export async function verifyOtpAndUpdateContact(
  input: VerifyOtpUpdateInput
): Promise<
  | { success: true; token?: string; customer?: HttpTypes.StoreCustomer }
  | { success: false; error: string }
> {
  const headers = await getAuthHeaders()
  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  const { email, phone, otp } = input
  if ((email && phone) || (!email && !phone)) {
    return {
      success: false,
      error: "Exactly one of email or phone is required",
    }
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return { success: false, error: "กรุณากรอก OTP 6 หลักให้ถูกต้อง" }
  }

  try {
    const res = await sdk.client.fetch<{
      success: boolean
      error?: string
      token?: string
      customer?: HttpTypes.StoreCustomer
    }>("/store/customers/me/verify-otp-update", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: {
        email,
        phone: phone ? normalizeThaiPhoneNumber(phone) : phone,
        otp,
      },
    })

    if (!res.success) {
      return { success: false, error: res.error ?? "ไม่สามารถยืนยัน OTP ได้" }
    }

    if (res.token) {
      await setAuthToken(res.token)
    }
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return {
      success: true,
      token: res.token,
      customer: res.customer,
    }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

/**
 * Upload avatar for the logged-in customer.
 * Uses POST /store/customers/me/avatar (multipart/form-data, field "avatar").
 */
export async function uploadAvatar(
  file: File
): Promise<
  | { success: true; avatar_url: string; avatar_blurhash?: string }
  | { success: false; error: string }
> {
  console.log("[uploadAvatar] 1. Starting", {
    filename: file.name,
    size: file.size,
    type: file.type,
  })

  const headers = await getAuthHeaders()
  console.log("[uploadAvatar] 2. Auth headers", {
    hasHeaders: !!headers,
    keyCount: headers ? Object.keys(headers).length : 0,
  })
  if (!headers || Object.keys(headers).length === 0) {
    console.warn("[uploadAvatar] No auth headers available")
    return { success: false, error: "Unauthorized" }
  }

  const formData = new FormData()
  formData.append("avatar", file)

  try {
    const baseUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    console.log("[uploadAvatar] 3. Sending request", {
      url: `${baseUrl}/store/customers/me/avatar`,
    })

    const res = await fetch(`${baseUrl}/store/customers/me/avatar`, {
      method: "POST",
      headers: {
        "x-publishable-api-key": publishableKey,
        ...(headers as Record<string, string>),
      },
      body: formData,
    })

    console.log("[uploadAvatar] 4. Response received", {
      status: res.status,
      ok: res.ok,
    })

    const data = await res.json().catch((parseErr) => {
      console.error("[uploadAvatar] Failed to parse response JSON", parseErr)
      return {}
    })
    console.log("[uploadAvatar] 5. Body parsed", {
      hasData: !!data,
      keys: data ? Object.keys(data) : [],
    })

    if (!res.ok) {
      console.error("[uploadAvatar] Upload failed", {
        status: res.status,
        error: data?.message ?? data?.error,
        responseData: data,
      })
      return {
        success: false,
        error: data?.message ?? data?.error ?? "Upload failed",
      }
    }

    const avatarUrl = data.avatar_url ?? data.customer?.metadata?.avatar_url
    if (!avatarUrl) {
      console.error("[uploadAvatar] No avatar URL in response", {
        responseData: data,
        hasAvatarUrl: !!data.avatar_url,
        hasCustomerMetadata: !!data.customer?.metadata?.avatar_url,
      })
      return { success: false, error: "No avatar URL returned" }
    }

    const avatarBlurhash =
      data.avatar_blurhash ?? data.customer?.metadata?.avatar_blurhash

    console.log("[uploadAvatar] 6. Upload successful", {
      avatarUrl: avatarUrl?.slice(0, 50),
      hasBlurhash: !!avatarBlurhash,
    })

    console.log("[uploadAvatar] 7. Revalidating cache…")
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    console.log("[uploadAvatar] 8. Done")

    return {
      success: true,
      avatar_url: avatarUrl,
      ...(avatarBlurhash && { avatar_blurhash: avatarBlurhash }),
    }
  } catch (err: any) {
    console.error("[uploadAvatar] Exception during upload", {
      error: err?.message ?? String(err),
      stack: err?.stack,
      name: err?.name,
    })
    return { success: false, error: err?.message ?? String(err) }
  }
}

// Legacy email/password signup - kept for backwards compatibility
export async function signup(formData: FormData) {
  const password = formData.get("password") as string
  const customerForm = {
    email: formData.get("email") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    phone: normalizeThaiPhoneNumber(formData.get("phone") as string),
  }

  try {
    const token = await sdk.auth.register("customer", "emailpass", {
      email: customerForm.email,
      password: password,
    })

    await setAuthToken(token as string)

    const headers = {
      ...(await getAuthHeaders()),
    }

    const { customer: createdCustomer } = await sdk.store.customer.create(
      customerForm,
      {},
      headers
    )

    const loginToken = await sdk.auth.login("customer", "emailpass", {
      email: customerForm.email,
      password,
    })

    await setAuthToken(loginToken as string)

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    // Medusa cart is only created at checkout; clear any stale cart cookie so we never POST /store/carts/:id/customer
    await removeCartId()

    return createdCustomer
  } catch (error: any) {
    return error.toString()
  }
}

// Legacy email/password login - kept for backwards compatibility
export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    await sdk.auth
      .login("customer", "emailpass", { email, password })
      .then(async (token) => {
        await setAuthToken(token as string)
        const customerCacheTag = await getCacheTag("customers")
        revalidateTag(customerCacheTag)
      })
  } catch (error: any) {
    return error.toString()
  }

  try {
    await removeCartId()
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Request OTP for a given identifier (email or phone).
 * Uses the custom /store/auth/signin backend route.
 */
export async function requestOtp(formData: FormData) {
  const identifier = (formData.get("identifier") as string)?.trim()

  if (!identifier) {
    return "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์"
  }

  try {
    const isEmail = identifier.includes("@")
    const payload: { email?: string; phone?: string } = {}

    if (isEmail) {
      payload.email = identifier
    } else {
      payload.phone = normalizeThaiPhoneNumber(identifier)
    }

    const res = await sdk.client.fetch<{ success: boolean; error?: string }>(
      `/store/auth/signin`,
      {
        method: "POST",
        body: payload,
      }
    )

    if (!res.success) {
      return res.error || "ไม่สามารถส่ง OTP ได้"
    }

    return null
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Verify OTP and log in the customer.
 * Uses /store/auth/signin/verify and stores the returned JWT.
 */
export async function verifyOtpAndLogin(formData: FormData) {
  const identifier = (formData.get("identifier") as string)?.trim()
  const otp = (formData.get("otp") as string)?.trim()

  if (!identifier) {
    return "กรุณากรอกอีเมลหรือเบอร์โทรศัพท์"
  }

  if (!otp || !/^\d{6}$/.test(otp)) {
    return "กรุณากรอก OTP 6 หลักให้ถูกต้อง"
  }

  try {
    const isEmail = identifier.includes("@")
    const payload: { email?: string; phone?: string; otp: string } = {
      otp,
    }

    if (isEmail) {
      payload.email = identifier
    } else {
      payload.phone = normalizeThaiPhoneNumber(identifier)
    }

    const res = await sdk.client.fetch<{
      success: boolean
      error?: string
      token?: string
    }>(`/store/auth/signin/verify`, {
      method: "POST",
      body: payload,
    })

    if (!res.success || !res.token) {
      return res.error || "ไม่สามารถยืนยัน OTP ได้"
    }

    // Store JWT in cookies
    await setAuthToken(res.token as string)

    // Revalidate customer cache; clear any stale Medusa cart (cart only created at checkout)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    await removeCartId()

    return null
  } catch (error: any) {
    return error.toString()
  }
}

/**
 * Clear Medusa cart cookie. Safe to call when the login page loads so we don't
 * carry a stale cart. Must be run as a Server Action (e.g. from a client useEffect).
 */
export async function clearMedusaCartForLoginPage() {
  await removeCartId()
}

export async function signout() {
  await finalizeSignout()
  redirect(`/`)
}

export async function finalizeSignout() {
  try {
    await sdk.auth.logout()
  } catch {
    // Continue cleanup even if backend logout request fails.
  }

  await removeAuthToken()

  const customerCacheTag = await getCacheTag("customers")
  revalidateTag(customerCacheTag)

  await removeCartId()

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

/**
 * Request account deletion (soft delete). Calls DELETE /store/customers/me/delete.
 * On success, clears session and redirects to "/". On failure, returns { success: false, error }.
 * redirect() is called outside try so its throw is not caught (Next.js uses throw for redirects).
 */
export async function requestDeleteAccount(): Promise<
  { success: true } | { success: false; error: string }
> {
  const headers = await getAuthHeaders()
  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const result = await sdk.client.fetch<{ success?: boolean }>(
      "/store/customers/me/delete",
      {
        method: "DELETE",
        headers,
        cache: "no-store",
      }
    )

    if (result?.success !== true) {
      return { success: false, error: "Request failed" }
    }

    await sdk.auth.logout()
    await removeAuthToken()
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    await removeCartId()
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : err != null
          ? String(err)
          : "Request failed"
    return { success: false, error: message }
  }

  redirect("/")
}

export async function transferCart() {
  const cartId = await getCartId()

  if (!cartId) {
    return
  }

  const headers = await getAuthHeaders()

  await sdk.store.cart.transferCart(cartId, {}, headers)

  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)
}

export const addCustomerAddress = async (formData: FormData): Promise<any> => {
  const address = {
    address_name: formData.get("address_name") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: (formData.get("company") as string) || "",
    address_1: formData.get("address_1") as string,
    address_2: (formData.get("address_2") as string) || "",
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    country_code: formData.get("country_code") as string,
    phone: normalizeThaiPhoneNumber(formData.get("phone") as string),
    province: formData.get("province") as string,
    is_default_billing: Boolean(formData.get("isDefaultBilling")),
    is_default_shipping: Boolean(formData.get("isDefaultShipping")),
    // metadata: {
    //   recipientphone: formData.get("recipientphone") as string,
    // },
  } as HttpTypes.StoreCreateCustomerAddress

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.customer
    .createAddress(address, {}, headers)
    .then(async ({ customer }) => {
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err) => {
      return { success: false, error: err.toString() }
    })
}

export const deleteCustomerAddress = async (
  addressId: string
): Promise<{ success: boolean; error: string | null }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.store.customer.deleteAddress(addressId, headers)
    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export const updateCustomerAddress = async (
  formData: FormData
): Promise<any> => {
  const addressId = formData.get("addressId") as string

  if (!addressId) {
    return { success: false, error: "Address ID is required" }
  }

  const address = {
    address_name: formData.get("address_name") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    company: (formData.get("company") as string) || "",
    address_1: formData.get("address_1") as string,
    address_2: (formData.get("address_2") as string) || "",
    city: formData.get("city") as string,
    postal_code: formData.get("postal_code") as string,
    province: formData.get("province") as string,
    country_code: formData.get("country_code") as string,
  } as HttpTypes.StoreUpdateCustomerAddress

  if (formData.has("isDefaultShipping")) {
    address.is_default_shipping = Boolean(formData.get("isDefaultShipping"))
  }
  if (formData.has("isDefaultBilling")) {
    address.is_default_billing = Boolean(formData.get("isDefaultBilling"))
  }

  const phone = formData.get("phone") as string

  if (phone) {
    address.phone = normalizeThaiPhoneNumber(phone)
  }

  const headers = await getAuthHeaders()
  const backendUrl = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

  try {
    const response = await fetch(
      `${backendUrl}/store/customers/me/addresses/${addressId}/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": publishableKey,
          ...headers,
        },
        body: JSON.stringify(address),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText || "Failed to update address",
      }))
      return {
        success: false,
        error: errorData.message || "Failed to update address",
      }
    }

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)
    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export const updateCustomerPassword = async (
  password: string,
  token: string
): Promise<any> => {
  const res = await fetch(
    `${process.env.MEDUSA_BACKEND_URL}/auth/customer/emailpass/update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    }
  )
    .then(async () => {
      await removeAuthToken()
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, error: null }
    })
    .catch((err: any) => {
      return { success: false, error: err.toString() }
    })

  return res
}

export const sendResetPasswordEmail = async (email: string) => {
  const res = await sdk.auth
    .resetPassword("customer", "emailpass", {
      identifier: email,
    })
    .then(() => {
      return { success: true, error: null }
    })
    .catch((err: any) => {
      return { success: false, error: err.toString() }
    })

  return res
}

export const listAddressesByPhone = async (
  phone: string
): Promise<HttpTypes.StoreCustomerAddress[]> => {
  if (!phone) {
    return []
  }

  const normalizedPhone = normalizeThaiPhoneNumber(phone)
  if (!normalizedPhone) {
    return []
  }

  const res = await fetchQuery("/store/phone-addresses", {
    method: "GET",
    query: { phone: normalizedPhone },
  })

  if (!res.ok || !res.data?.addresses) {
    return []
  }

  return res.data.addresses as HttpTypes.StoreCustomerAddress[]
}

export const retrieveCustomer =
  async (): Promise<HttpTypes.StoreCustomer | null> => {
    const authHeaders = await getAuthHeaders()

    if (!authHeaders) return null

    const headers = {
      ...authHeaders,
      "x-publishable-api-key":
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    }

    return await sdk.client
      .fetch<{ customer: HttpTypes.StoreCustomer }>(`/store/customers/me`, {
        method: "GET",
        query: {
          fields: "*orders,*addresses",
        },
        headers,
        cache: "no-store",
      })
      .then(({ customer }) => customer)
      .catch((err) => {
        // Quietly fail for 401s (expected if token expired)
        if (err.status !== 401) {
          // console.error("[retrieveCustomer] Error:", err)
        }
        return null
      })
  }

export type CustomerPaymentMethod = {
  id: string
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
  funding: string | null
  country: string | null
  is_default: boolean
}

const DUPLICATE_CARD_ERROR_MESSAGE = "บัตรนี้ถูกบันทึกไว้แล้ว"

function extractCustomerPaymentMethodError(err: any): {
  error: string
  type?: string
  code?: string
} {
  let errorMessage = err?.message ?? String(err)
  let errorType: string | undefined
  let errorCode: string | undefined

  if (err?.body) {
    if (typeof err.body === "object") {
      if (err.body.message) {
        errorMessage = err.body.message
      }
      if (err.body.type) {
        errorType = err.body.type
      }
      if (err.body.code) {
        errorCode = err.body.code
      }
    } else if (typeof err.body === "string") {
      try {
        const parsed = JSON.parse(err.body)
        if (parsed.message) {
          errorMessage = parsed.message
        }
        if (parsed.type) {
          errorType = parsed.type
        }
        if (parsed.code) {
          errorCode = parsed.code
        }
      } catch {
        // Not JSON, use as is
      }
    }
  }

  if (errorCode === "duplicate_card") {
    errorMessage = DUPLICATE_CARD_ERROR_MESSAGE
  }

  return {
    error: errorMessage,
    type: errorType,
    code: errorCode,
  }
}

export async function getCustomerPaymentMethods(): Promise<
  | { success: true; paymentMethods: CustomerPaymentMethod[] }
  | { success: false; error: string }
> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const res = await sdk.client.fetch<{
      payment_methods: CustomerPaymentMethod[]
    }>("/store/customers/me/payment-methods", {
      method: "GET",
      headers,
      cache: "no-store",
    })

    return { success: true, paymentMethods: res.payment_methods ?? [] }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

export async function addCustomerPaymentMethod(options: {
  paymentMethodId: string
  makeDefault?: boolean
}): Promise<
  | { success: true; paymentMethod: CustomerPaymentMethod }
  | { success: false; error: string; type?: string; code?: string }
> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  if (!options.paymentMethodId) {
    return { success: false, error: "paymentMethodId is required" }
  }

  const postPaymentMethod = async () =>
    sdk.client.fetch<{
      payment_method: CustomerPaymentMethod
    }>("/store/customers/me/payment-methods", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: {
        payment_method_id: options.paymentMethodId,
        make_default: options.makeDefault ?? false,
      },
    })

  const attemptSave = async (): Promise<
    | { success: true; paymentMethod: CustomerPaymentMethod }
    | { success: false; error: string; type?: string; code?: string }
  > => {
    try {
      const res = await postPaymentMethod()
      const customerCacheTag = await getCacheTag("customers")
      revalidateTag(customerCacheTag)
      return { success: true, paymentMethod: res.payment_method }
    } catch (err: any) {
      return {
        success: false,
        ...extractCustomerPaymentMethodError(err),
      }
    }
  }

  const firstAttempt = await attemptSave()
  return firstAttempt
}

export async function updateCustomerPaymentMethod(
  paymentMethodId: string,
  makeDefault: boolean
): Promise<
  | { success: true; paymentMethod: CustomerPaymentMethod }
  | { success: false; error: string }
> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  if (!paymentMethodId) {
    return { success: false, error: "paymentMethodId is required" }
  }

  try {
    const res = await sdk.client.fetch<{
      payment_method: CustomerPaymentMethod
    }>(`/store/customers/me/payment-methods/${paymentMethodId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: {
        make_default: makeDefault,
      },
    })

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return { success: true, paymentMethod: res.payment_method }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

export async function deleteCustomerPaymentMethod(
  paymentMethodId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    return { success: false, error: "Unauthorized" }
  }

  if (!paymentMethodId) {
    return { success: false, error: "paymentMethodId is required" }
  }

  try {
    await sdk.client.fetch<{ success: boolean; error?: string }>(
      `/store/customers/me/payment-methods/${paymentMethodId}`,
      {
        method: "DELETE",
        headers,
      }
    )

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) }
  }
}

export async function saveCheckoutAddressForCustomer(
  address: AddressFormData
): Promise<{ success: true } | { success: false; error: string }> {
  console.log("[saveCheckoutAddressForCustomer] Called with:", {
    setAsDefault: address.setAsDefault,
    recipientFullName: address.recipientFullName,
    address: address.address,
    phone: address.phone,
  })

  const headers = await getAuthHeaders()

  if (!headers || Object.keys(headers).length === 0) {
    console.log("[saveCheckoutAddressForCustomer] Unauthorized - no headers")
    return { success: false, error: "Unauthorized" }
  }

  console.log("[saveCheckoutAddressForCustomer] Headers obtained, parsing name")

  const [firstName, ...rest] = (address.recipientFullName ?? "")
    .trim()
    .split(" ")

  console.log("[saveCheckoutAddressForCustomer] Name parsed:", {
    firstName,
    lastName: rest.join(" ") || "-",
  })

  const addressPayload = {
    first_name: firstName ?? "",
    last_name: rest.join(" ") || "-",
    address_1: address.address,
    address_2: address.district,
    city: address.subDistrict,
    province: address.province,
    postal_code: address.postalCode,
    country_code: "th",
    phone: normalizeThaiPhoneNumber(address.phone),
    is_default_shipping: address.setAsDefault ?? false,
    is_default_billing: address.setAsDefault ?? false,
  } as HttpTypes.StoreCreateCustomerAddress

  console.log(
    "[saveCheckoutAddressForCustomer] Calling SDK with payload:",
    addressPayload
  )

  try {
    const response = await sdk.store.customer.createAddress(
      addressPayload,
      {},
      headers
    )

    console.log("[saveCheckoutAddressForCustomer] SDK Response:", {
      success: true,
      addressCreated: !!response,
      is_default_shipping: address.setAsDefault ?? false,
    })

    const customerCacheTag = await getCacheTag("customers")
    revalidateTag(customerCacheTag)

    return { success: true }
  } catch (err: any) {
    console.error("[saveCheckoutAddressForCustomer] Error details:", {
      message: err?.message,
      response: err?.response,
      status: err?.status,
      data: err?.data,
      stack: err?.stack?.split("\n").slice(0, 3),
    })
    return { success: false, error: err?.message ?? String(err) }
  }
}

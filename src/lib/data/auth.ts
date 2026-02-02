"use server"

import { fetchQuery } from "@/lib/config"
import { revalidateTag } from "next/cache"
import { getCacheTag, setAuthToken } from "./cookies"
import { retrieveCustomer } from "./customer"

export async function checkAuthStatus() {
  const customer = await retrieveCustomer()
  return {
    isAuthenticated: !!customer,
    customer,
  }
}

export async function sendOTP(phone: string) {
  let res = await fetchQuery("/auth/customer/phone-auth", {
    method: "POST",
    body: { phone },
  })

  if (!res.ok && res.error?.message?.includes("does not exist")) {
    console.log("[sendOTP] User not found, registering...")
    const regRes = await fetchQuery("/auth/customer/phone-auth/register", {
      method: "POST",
      body: { phone },
    })

    if (!regRes.ok) {
      throw new Error(regRes.error?.message || "Failed to register user")
    }

    res = await fetchQuery("/auth/customer/phone-auth", {
      method: "POST",
      body: { phone },
    })
  }

  if (!res.ok) {
    throw new Error(res.error?.message || "Failed to send OTP")
  }

  return res.data
}

export async function verifyOTP(phone: string, otp: string) {
  // Use our custom route that manually handles JWT generation with correct claims
  const res = await fetchQuery("/store/auth/signin/verify", {
    method: "POST", // Changed to POST
    body: { phone, otp }, // Changed to body
  })

  if (!res.ok) {
    throw new Error(res.error?.message || "Invalid OTP")
  }

  if (res.data?.token) {
    await setAuthToken(res.data.token)
  }

  const customerCacheTag = await getCacheTag("customers")
  if (customerCacheTag) {
    await revalidateTag(customerCacheTag)
  }

  return res.data
}

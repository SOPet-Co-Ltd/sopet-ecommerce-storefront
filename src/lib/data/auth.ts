"use server"

import { fetchQuery } from "@/lib/config"
import { revalidateTag } from "next/cache"
import { getCacheTag, setAuthToken, setGuestPhone } from "./cookies"

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
  const res = await fetchQuery("/auth/customer/phone-auth/callback", {
    method: "GET",
    query: { phone, otp },
  })

  if (!res.ok) {
    throw new Error(res.error?.message || "Invalid OTP")
  }

  if (res.data?.token) {
    await setAuthToken(res.data.token)
  }

  const normalizedPhone = phone.replace(/\D/g, "")
  if (normalizedPhone) {
    await setGuestPhone(normalizedPhone)
  }

  const customerCacheTag = await getCacheTag("customers")
  if (customerCacheTag) {
    await revalidateTag(customerCacheTag)
  }

  return res.data
}

import { MEDUSA_BACKEND_URL } from "@/lib/config"
import { retrieveCart } from "@/lib/data/cart"
import { getAuthHeaders } from "@/lib/data/cookies"
import type {
  CheckoutCoupon,
  CheckoutPromotionsPayload,
} from "@/types/checkout-coupon"
import { NextRequest, NextResponse } from "next/server"

type ApplyCheckoutPromotionsBody = {
  cartId?: string
  codes?: string[]
}

type StoreCouponsListResponse = {
  coupons?: CheckoutCoupon[]
}

const CHECKOUT_COUPON_PAGE_SIZE = 200

async function fetchPromos(
  cartId: string,
  path: "site" | "vendor"
): Promise<CheckoutCoupon[]> {
  const headers = {
    ...(await getAuthHeaders()),
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }

  const url = new URL(`${MEDUSA_BACKEND_URL}/store/coupons/${path}`)
  url.searchParams.set("cart_id", cartId)
  url.searchParams.set("take", String(CHECKOUT_COUPON_PAGE_SIZE))
  url.searchParams.set("skip", "0")

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      cache: "no-store",
    })

    if (!response.ok) {
      return []
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as StoreCouponsListResponse

    return payload.coupons ?? []
  } catch {
    return []
  }
}

function normalizeCodes(codes: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const code of codes) {
    const trimmed = code.trim()
    if (!trimmed) {
      continue
    }

    const key = trimmed.toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(trimmed)
  }

  return result
}

async function storeCartPromotionsRequest(
  cartId: string,
  method: "POST" | "DELETE",
  promoCodes: string[]
) {
  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }

  const response = await fetch(
    `${MEDUSA_BACKEND_URL}/store/carts/${cartId}/promotions`,
    {
      method,
      headers,
      body: JSON.stringify({ promo_codes: promoCodes }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string
    }

    throw new Error(payload.message || "ไม่สามารถใช้โค้ดส่วนลดได้")
  }
}

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId")?.trim()

  if (!cartId) {
    return NextResponse.json({ message: "cartId is required" }, { status: 400 })
  }

  const [site, vendor] = await Promise.all([
    fetchPromos(cartId, "site"),
    fetchPromos(cartId, "vendor"),
  ])

  const payload: CheckoutPromotionsPayload = { site, vendor }
  return NextResponse.json(payload)
}

export async function POST(request: NextRequest) {
  const body = (await request
    .json()
    .catch(() => ({}))) as ApplyCheckoutPromotionsBody
  const cartId = body.cartId
  const targetCodes = normalizeCodes(
    Array.isArray(body.codes)
      ? body.codes.filter((code): code is string => typeof code === "string")
      : []
  )

  if (!cartId) {
    return NextResponse.json({ message: "cartId is required" }, { status: 400 })
  }

  if (targetCodes.length === 0) {
    return NextResponse.json({ message: "codes is required" }, { status: 400 })
  }

  try {
    const currentCart = await retrieveCart(cartId)

    if (!currentCart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 })
    }

    const currentCodes = (currentCart.promotions ?? [])
      .map((promotion) =>
        typeof promotion.code === "string" ? promotion.code.trim() : ""
      )
      .filter((code) => code.length > 0)

    const targetLower = new Set(targetCodes.map((code) => code.toLowerCase()))
    const currentLower = new Set(currentCodes.map((code) => code.toLowerCase()))

    const codesToRemove = currentCodes.filter(
      (code) => !targetLower.has(code.toLowerCase())
    )
    const codesToAdd = targetCodes.filter(
      (code) => !currentLower.has(code.toLowerCase())
    )

    if (codesToRemove.length > 0) {
      await storeCartPromotionsRequest(cartId, "DELETE", codesToRemove)
    }

    if (codesToAdd.length > 0) {
      await storeCartPromotionsRequest(cartId, "POST", codesToAdd)
    }

    const cart = await retrieveCart(cartId)

    if (!cart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 })
    }

    return NextResponse.json({ cart })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ไม่สามารถใช้โค้ดส่วนลดได้"

    return NextResponse.json({ message }, { status: 400 })
  }
}

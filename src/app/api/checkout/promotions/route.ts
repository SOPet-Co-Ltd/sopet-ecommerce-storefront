import { sdk } from "@/lib/config"
import { retrieveCart } from "@/lib/data/cart"
import { getAuthHeaders } from "@/lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

type ApplyCheckoutPromotionsBody = {
  cartId?: string
  codes?: string[]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ApplyCheckoutPromotionsBody
  const cartId = body.cartId
  const codes = Array.isArray(body.codes)
    ? body.codes.filter(
        (code): code is string => typeof code === "string" && code.trim().length > 0
      )
    : []

  if (!cartId) {
    return NextResponse.json({ message: "cartId is required" }, { status: 400 })
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    await sdk.store.cart.update(cartId, { promo_codes: codes }, {}, headers)
    const cart = await retrieveCart(cartId)

    return NextResponse.json({ cart })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ไม่สามารถใช้โค้ดส่วนลดได้"

    return NextResponse.json({ message }, { status: 400 })
  }
}

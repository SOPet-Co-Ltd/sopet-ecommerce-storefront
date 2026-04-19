import { MEDUSA_BACKEND_URL } from "@/lib/config"
import { retrieveCart } from "@/lib/data/cart"
import { getAuthHeaders } from "@/lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params
  const cartId = _request.nextUrl.searchParams.get("cartId")

  if (!cartId) {
    return NextResponse.json({ message: "cartId is required" }, { status: 400 })
  }

  if (!code) {
    return NextResponse.json({ message: "code is required" }, { status: 400 })
  }

  const headers = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
    "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }

  try {
    const response = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}/promotions`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({
        promo_codes: [code],
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string
      }

      return NextResponse.json(
        {
          message: payload.message || "ไม่สามารถลบโค้ดส่วนลดได้",
        },
        { status: response.status || 400 }
      )
    }

    const cart = await retrieveCart(cartId)
    return NextResponse.json({ cart })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "ไม่สามารถลบโค้ดส่วนลดได้"

    return NextResponse.json({ message }, { status: 400 })
  }
}

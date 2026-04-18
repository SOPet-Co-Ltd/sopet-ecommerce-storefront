import { retrieveCart } from "@/lib/data/cart"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId")

  if (!cartId) {
    return NextResponse.json(
      {
        message: "cartId is required",
      },
      {
        status: 400,
      }
    )
  }

  const cart = await retrieveCart(cartId)

  return NextResponse.json({ cart })
}

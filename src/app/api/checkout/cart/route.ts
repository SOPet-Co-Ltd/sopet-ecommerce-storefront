import { retrieveCart } from "@/lib/data/cart"
import { getCartId } from "@/lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cookieCartId = await getCartId()

  if (!cookieCartId) {
    return NextResponse.json(
      {
        message: "Forbidden: No cart session found",
      },
      {
        status: 403,
      }
    )
  }

  const clientCartId = request.nextUrl.searchParams.get("cartId")

  if (clientCartId && clientCartId !== cookieCartId) {
    return NextResponse.json(
      {
        message: "Forbidden: Cart ID mismatch",
      },
      {
        status: 403,
      }
    )
  }

  const cart = await retrieveCart(cookieCartId)

  return NextResponse.json({ cart })
}


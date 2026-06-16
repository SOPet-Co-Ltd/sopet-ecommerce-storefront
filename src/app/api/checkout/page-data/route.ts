import { getCheckoutPageBundleDataFromStoreApi } from "@/lib/data/checkout-page"
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

  const regionId = request.nextUrl.searchParams.get("regionId")
  const payload = await getCheckoutPageBundleDataFromStoreApi(
    cookieCartId,
    regionId
  )

  return NextResponse.json(payload)
}

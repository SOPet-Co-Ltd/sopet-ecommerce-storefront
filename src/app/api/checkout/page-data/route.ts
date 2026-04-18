import { getCheckoutPageBundleDataFromStoreApi } from "@/lib/data/checkout-page"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId")
  const regionId = request.nextUrl.searchParams.get("regionId")

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

  const payload = await getCheckoutPageBundleDataFromStoreApi(cartId, regionId)

  return NextResponse.json(payload)
}

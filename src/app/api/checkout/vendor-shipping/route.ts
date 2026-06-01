import { listVendorShippingMethods } from "@/lib/data/fulfillment"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId")
  const sellerId = request.nextUrl.searchParams.get("sellerId")

  if (!cartId || !sellerId) {
    return NextResponse.json(
      { message: "cartId and sellerId are required" },
      { status: 400 }
    )
  }

  const shipping_options = await listVendorShippingMethods(cartId, sellerId)

  return NextResponse.json({ shipping_options })
}

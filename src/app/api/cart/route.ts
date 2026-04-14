import { getCartForCustomerCartPage } from "@/lib/data/customer-cart-page"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "th"
  const cart = await getCartForCustomerCartPage(locale)

  return NextResponse.json({ cart })
}

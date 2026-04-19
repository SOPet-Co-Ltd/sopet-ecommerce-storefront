import { fetchCoupons, fetchMyCoupons } from "@/lib/data/coupons"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const cartId = request.nextUrl.searchParams.get("cartId") || undefined
  const vendorName = request.nextUrl.searchParams.get("vendorName") || undefined
  const eligibilityFingerprint =
    request.nextUrl.searchParams.get("eligibilityFingerprint") || null

  const coupons = vendorName
    ? await fetchCoupons(undefined, 200, 0, { vendorName })
    : await fetchMyCoupons({ cartId, vendorName })

  return NextResponse.json({
    coupons,
    eligibilityFingerprint,
  })
}

import { NextResponse } from "next/server"

import { getCouponsPageBundleData } from "@/lib/data/coupons-page"

export async function GET() {
  const payload = await getCouponsPageBundleData()
  return NextResponse.json(payload)
}

import { getOrdersPageBundleData } from "@/lib/data/order-management-page"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "100")
  const offset = Number(request.nextUrl.searchParams.get("offset") ?? "0")

  const payload = await getOrdersPageBundleData(
    Number.isFinite(limit) ? limit : 100,
    Number.isFinite(offset) ? offset : 0
  )

  return NextResponse.json(payload)
}

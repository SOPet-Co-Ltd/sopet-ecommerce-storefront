import { getOrderDetailsPageBundleData } from "@/lib/data/order-management-page"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const payload = await getOrderDetailsPageBundleData(id)

  if (!payload.order) {
    return NextResponse.json(
      {
        message: "Order not found",
      },
      {
        status: 404,
      }
    )
  }

  return NextResponse.json(payload)
}

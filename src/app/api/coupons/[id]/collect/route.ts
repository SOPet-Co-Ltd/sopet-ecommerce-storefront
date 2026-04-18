import { NextResponse } from "next/server"

import { collectCoupon } from "@/lib/data/coupons"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await collectCoupon(id)

  if (!result.success) {
    const status = result.message === "Unauthorized" ? 401 : 400

    return NextResponse.json(
      {
        message: result.message || "ไม่สามารถเก็บคูปองได้",
      },
      {
        status,
      }
    )
  }

  return NextResponse.json(result)
}

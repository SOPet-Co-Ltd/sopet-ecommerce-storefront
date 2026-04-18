import { fetchQuery } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import type { CustomerCartItemCreateInput } from "@/types/customer-cart"
import { NextRequest, NextResponse } from "next/server"

type CreateItemsBody = {
  items?: CustomerCartItemCreateInput[]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CreateItemsBody
  const items = Array.isArray(body.items) ? body.items : []

  if (!items.length) {
    return NextResponse.json({ message: "items array is required" }, { status: 400 })
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery("/store/customer-cart/items", {
    method: "POST",
    headers,
    body: { items },
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: response.error?.message || "Failed to add items to cart" },
      { status: response.status || 400 }
    )
  }

  return NextResponse.json(response.data)
}

import { fetchQuery } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import {
  buildCartItemPriceKey,
  CartItemPriceResolutionError,
  resolveCartItemUnitPrices,
} from "@/lib/data/resolve-cart-item-prices"
import { DEFAULT_REGION } from "@/lib/site-defaults"
import type { CustomerCartItemCreateInput } from "@/types/customer-cart"
import { NextRequest, NextResponse } from "next/server"

type CreateItemsBody = {
  items?: CustomerCartItemCreateInput[]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as CreateItemsBody
  const items = Array.isArray(body.items) ? body.items : []
  const locale =
    request.nextUrl.searchParams.get("locale")?.trim().toLowerCase() ||
    DEFAULT_REGION

  if (!items.length) {
    return NextResponse.json(
      { message: "items array is required" },
      { status: 400 }
    )
  }

  for (const item of items) {
    if (
      !item.productId ||
      !item.variantId ||
      typeof item.quantity !== "number" ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return NextResponse.json(
        {
          message:
            "Each item requires productId, variantId, and positive quantity",
        },
        { status: 400 }
      )
    }
  }

  let priceByKey: Map<string, number>

  try {
    priceByKey = await resolveCartItemUnitPrices(
      locale,
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
      }))
    )
  } catch (error) {
    if (error instanceof CartItemPriceResolutionError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { message: "Failed to resolve cart item prices" },
      { status: 400 }
    )
  }

  const resolvedItems: Array<{
    productId: string
    variantId: string
    quantity: number
    unitPriceSnapshot: number
    source: string | null
    metadata: Record<string, unknown> | null
  }> = []

  for (const item of items) {
    const key = buildCartItemPriceKey(item.productId, item.variantId)
    const unitPriceSnapshot = priceByKey.get(key)

    if (typeof unitPriceSnapshot !== "number") {
      return NextResponse.json(
        { message: `No price found for variant ${item.variantId}` },
        { status: 400 }
      )
    }

    resolvedItems.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPriceSnapshot,
      source: item.source ?? null,
      metadata: item.metadata ?? null,
    })
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery("/store/customer-cart/items", {
    method: "POST",
    headers,
    body: { items: resolvedItems },
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

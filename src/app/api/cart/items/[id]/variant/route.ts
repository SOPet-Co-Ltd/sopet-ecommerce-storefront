import { fetchQuery } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

type ChangeVariantBody = {
  variantId?: string
  quantity?: number
}

type CustomerCartItemApi = {
  id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price_snapshot: number | null
  status: string
  source: string | null
  metadata: Record<string, unknown> | null
}

const normalizeNullable = <T>(value: T | null | undefined): T | null =>
  value == null ? null : value

const serializeMetadata = (metadata: Record<string, unknown> | null) =>
  metadata ? JSON.stringify(metadata) : null

const buildKey = (
  item: Pick<
    CustomerCartItemApi,
    | "product_id"
    | "variant_id"
    | "unit_price_snapshot"
    | "source"
    | "metadata"
  >
) => {
  return [
    item.product_id,
    item.variant_id,
    String(normalizeNullable(item.unit_price_snapshot)),
    normalizeNullable(item.source) ?? "",
    serializeMetadata(item.metadata) ?? "",
  ].join("|")
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as ChangeVariantBody
  const variantId = body.variantId
  const quantity = body.quantity

  if (!id || !variantId || typeof quantity !== "number") {
    return NextResponse.json(
      { message: "itemId, variantId, and quantity are required" },
      { status: 400 }
    )
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const listResponse = await fetchQuery("/store/customer-cart/items", {
    method: "GET",
    headers,
    cache: "no-store",
  })

  if (!listResponse.ok) {
    return NextResponse.json(
      { message: listResponse.error?.message || "Failed to load cart items" },
      { status: listResponse.status || 400 }
    )
  }

  const items =
    ((listResponse.data as { items?: CustomerCartItemApi[] } | null)?.items ??
      []) as CustomerCartItemApi[]
  const currentItem = items.find((item) => item.id === id)

  if (!currentItem) {
    return NextResponse.json(
      { message: "Customer cart item not found" },
      { status: 404 }
    )
  }

  const targetKey = buildKey({
    ...currentItem,
    variant_id: variantId,
  })

  const existingSame = items.find(
    (item) =>
      item.id !== id && item.status === "in_cart" && buildKey(item) === targetKey
  )

  if (existingSame) {
    const mergeResponse = await fetchQuery(
      `/store/customer-cart/items/${existingSame.id}`,
      {
        method: "PATCH",
        headers,
        body: {
          quantity: (existingSame.quantity ?? 0) + quantity,
        },
        cache: "no-store",
      }
    )

    if (!mergeResponse.ok) {
      return NextResponse.json(
        { message: mergeResponse.error?.message || "Failed to merge cart items" },
        { status: mergeResponse.status || 400 }
      )
    }

    const deleteResponse = await fetchQuery(`/store/customer-cart/items/${id}`, {
      method: "DELETE",
      headers,
      cache: "no-store",
    })

    if (!deleteResponse.ok) {
      return NextResponse.json(
        {
          message:
            deleteResponse.error?.message || "Failed to remove replaced cart item",
        },
        { status: deleteResponse.status || 400 }
      )
    }

    return NextResponse.json({ success: true })
  }

  const updateResponse = await fetchQuery(`/store/customer-cart/items/${id}`, {
    method: "PATCH",
    headers,
    body: {
      quantity,
      variant_id: variantId,
    },
    cache: "no-store",
  })

  if (!updateResponse.ok) {
    return NextResponse.json(
      { message: updateResponse.error?.message || "Failed to change variant" },
      { status: updateResponse.status || 400 }
    )
  }

  return NextResponse.json(updateResponse.data)
}

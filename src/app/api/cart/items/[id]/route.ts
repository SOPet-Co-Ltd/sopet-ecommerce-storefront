import { fetchQuery } from "@/lib/config"
import { getAuthHeaders } from "@/lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >

  if (!id) {
    return NextResponse.json({ message: "Item id is required" }, { status: 400 })
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery(`/store/customer-cart/items/${id}`, {
    method: "PATCH",
    headers,
    body,
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: response.error?.message || "Failed to update cart item" },
      { status: response.status || 400 }
    )
  }

  return NextResponse.json(response.data)
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ message: "Item id is required" }, { status: 400 })
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const response = await fetchQuery(`/store/customer-cart/items/${id}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      { message: response.error?.message || "Failed to delete cart item" },
      { status: response.status || 400 }
    )
  }

  return NextResponse.json(response.data ?? { success: true })
}

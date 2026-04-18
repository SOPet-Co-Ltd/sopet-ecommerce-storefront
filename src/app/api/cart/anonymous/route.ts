import { resolveAnonymousCartPage } from "@/lib/data/anonymous-cart-page"
import type { AnonymousCartItemInput } from "@/types/customer-cart"
import { NextRequest, NextResponse } from "next/server"

type ResolveAnonymousCartBody = {
  locale?: string
  items?: AnonymousCartItemInput[]
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ResolveAnonymousCartBody
  const locale = body.locale || "th"
  const items = Array.isArray(body.items) ? body.items : []
  const cart = await resolveAnonymousCartPage(locale, items)

  return NextResponse.json({ cart })
}

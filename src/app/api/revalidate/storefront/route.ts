import {
  STOREFRONT_BANNERS_TAG,
  STOREFRONT_SPONSORS_TAG,
} from "@/lib/cache/constants"
import { revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Invalidates Next.js Data Cache entries tagged for home page banners and sponsors.
 * Set REVALIDATE_SECRET in the environment, then call:
 *   curl -X POST -H "Authorization: Bearer $REVALIDATE_SECRET" \
 *     https://<host>/api/revalidate/storefront
 */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret?.length) {
    return NextResponse.json(
      { message: "REVALIDATE_SECRET is not configured" },
      { status: 500 }
    )
  }

  const authHeader = request.headers.get("authorization")
  const bearer =
    authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ??
    request.nextUrl.searchParams.get("secret")

  if (bearer !== secret) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  revalidateTag(STOREFRONT_BANNERS_TAG)
  revalidateTag(STOREFRONT_SPONSORS_TAG)

  return NextResponse.json({
    revalidated: true,
    tags: [STOREFRONT_BANNERS_TAG, STOREFRONT_SPONSORS_TAG],
  })
}

import { NextResponse } from "next/server"
import { getActiveAdsModalEntry } from "@/lib/data/ads-modal"

export const revalidate = 60

export async function GET() {
  const ad = await getActiveAdsModalEntry()

  if (!ad) {
    return new NextResponse(null, { status: 204 })
  }

  return NextResponse.json({ ad })
}

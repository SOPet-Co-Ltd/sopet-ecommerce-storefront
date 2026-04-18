import { getNotificationsPageBundleData } from "@/lib/data/notifications-page"
import { NextResponse } from "next/server"

export async function GET() {
  const payload = await getNotificationsPageBundleData()
  return NextResponse.json(payload)
}

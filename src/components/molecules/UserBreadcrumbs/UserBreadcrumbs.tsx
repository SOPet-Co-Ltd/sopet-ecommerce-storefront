"use client"

import { useParams, usePathname } from "next/navigation"
import { Breadcrumbs } from "@/components/atoms"
import { cn } from "@/lib/utils"

/** Path segment (after /user) to breadcrumb label. */
const USER_SEGMENT_LABELS: Record<string, string> = {
  profile: "ข้อมูลส่วนตัว",
  orders: "คำสั่งซื้อสินค้า",
  addresses: "ที่อยู่สำหรับจัดส่ง",
  credit: "บัตรเครดิต/เดบิต",
  notifications: "การแจ้งเตือน",
  help: "ศูนย์ช่วยเหลือ",
  delete: "คำขอลบบัญชี",
}

function getSegmentLabel(segment: string): string {
  return USER_SEGMENT_LABELS[segment] ?? segment
}

export function UserBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname()
  const { locale } = useParams()
  const localeStr = String(locale ?? "")

  const pathWithoutLocale =
    localeStr.length > 0
      ? pathname.replace(new RegExp(`^/${localeStr}`), "") || "/"
      : pathname || "/"
  const isUserPath =
    pathWithoutLocale === "/user" || pathWithoutLocale.startsWith("/user/")

  const items: { label: string; path: string }[] = [
    { label: "หน้าแรก", path: "/user" },
  ]

  if (isUserPath && pathWithoutLocale !== "/user") {
    const segments = pathWithoutLocale.split("/").filter(Boolean).slice(1)
    let cumulativePath = "/user"

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      cumulativePath += `/${segment}`
      const label = getSegmentLabel(segment)
      items.push({ label, path: cumulativePath })
    }
  }

  return <Breadcrumbs items={items} className={cn(className)} />
}

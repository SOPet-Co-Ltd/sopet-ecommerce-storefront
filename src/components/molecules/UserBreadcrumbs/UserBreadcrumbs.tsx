"use client"

import { useParams, usePathname } from "next/navigation"
import { Breadcrumbs } from "@/components/atoms"
import { USER_SEGMENT_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

function getSegmentLabel(segment: string): string {
  return USER_SEGMENT_LABELS[segment]?.label ?? segment
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
    const segments = pathWithoutLocale
      .replace(/^\/user\/?/, "")
      .split("/")
      .filter(Boolean)
    let i = 0
    while (i < segments.length) {
      const segment = segments[i]
      const config = USER_SEGMENT_LABELS[segment]
      const parentPath = "/user/" + segments.slice(0, i + 1).join("/")
      const remainingPath = segments.slice(i + 1).join("/")

      if (config?.routes && remainingPath && config.routes[remainingPath]) {
        items.push({ label: config.label, path: parentPath })
        items.push({
          label: config.routes[remainingPath].label,
          path: parentPath + "/" + remainingPath,
        })
        i += 1 + remainingPath.split("/").length
      } else {
        items.push({
          label: config?.label ?? segment,
          path: parentPath,
        })
        i += 1
      }
    }
  }

  return <Breadcrumbs items={items} className={cn(className)} />
}

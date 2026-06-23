"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/lib/react-query/query-keys"
import type { NotificationsPageBundleData } from "@/lib/data/notifications-page"

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text()

  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}

async function fetchNotificationsPageData(): Promise<NotificationsPageBundleData> {
  const response = await fetch("/api/notifications", {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await parseJson<{ message?: string }>(response)
    throw new Error(payload.message || "ไม่สามารถโหลดการแจ้งเตือนได้")
  }

  return parseJson<NotificationsPageBundleData>(response)
}

export function useNotificationsPageQuery(
  initialData?: NotificationsPageBundleData
) {
  return useQuery({
    queryKey: queryKeys.notifications.page(),
    queryFn: fetchNotificationsPageData,
    initialData,
    initialDataUpdatedAt: initialData ? Date.now() : undefined,
    staleTime: 30 * 1000,
  })
}

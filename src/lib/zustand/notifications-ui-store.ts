import { create } from "zustand"

import type { NotificationTab } from "@/types/notification"

const SEEN_NOTIFICATION_IDS_STORAGE_KEY = "sopet_seen_notification_ids"
const SEEN_PROMOTION_IDS_STORAGE_KEY = "sopet_seen_promotion_ids"

type NotificationsUiState = {
  seenNotificationIds: string[]
  seenPromotionIds: string[]
  hasHydratedSeenIds: boolean
  hydrateSeenIds: () => void
  markTabItemsSeen: (tab: NotificationTab, ids: string[]) => void
}

function readStoredIds(storageKey: string): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawValue = localStorage.getItem(storageKey)
    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (value): value is string => typeof value === "string" && value.length > 0
    )
  } catch {
    return []
  }
}

function persistIds(storageKey: string, ids: string[]) {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(ids))
  } catch {}
}

export const useNotificationsUiStore = create<NotificationsUiState>(
  (set, get) => ({
    seenNotificationIds: [],
    seenPromotionIds: [],
    hasHydratedSeenIds: false,
    hydrateSeenIds: () => {
      if (get().hasHydratedSeenIds) {
        return
      }

      set({
        seenNotificationIds: readStoredIds(SEEN_NOTIFICATION_IDS_STORAGE_KEY),
        seenPromotionIds: readStoredIds(SEEN_PROMOTION_IDS_STORAGE_KEY),
        hasHydratedSeenIds: true,
      })
    },
    markTabItemsSeen: (tab, ids) => {
      if (!ids.length) {
        return
      }

      if (tab === "noti") {
        const seenIds = new Set(get().seenNotificationIds)
        const newIds = ids.filter((id) => !seenIds.has(id))

        if (!newIds.length) {
          return
        }

        const nextIds = [...seenIds, ...newIds]
        persistIds(SEEN_NOTIFICATION_IDS_STORAGE_KEY, nextIds)

        set({
          seenNotificationIds: nextIds,
        })
        return
      }

      const seenIds = new Set(get().seenPromotionIds)
      const newIds = ids.filter((id) => !seenIds.has(id))

      if (!newIds.length) {
        return
      }

      const nextIds = [...seenIds, ...newIds]
      persistIds(SEEN_PROMOTION_IDS_STORAGE_KEY, nextIds)

      set({
        seenPromotionIds: nextIds,
      })
    },
  })
)

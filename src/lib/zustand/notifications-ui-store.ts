import { create } from "zustand"

import type { NotificationTab } from "@/types/notification"

const SEEN_NOTIFICATION_IDS_STORAGE_KEY = "sopet_seen_notification_ids"
const SEEN_PROMOTION_IDS_STORAGE_KEY = "sopet_seen_promotion_ids"

type NotificationsUiState = {
  activeTab: NotificationTab
  seenNotificationIds: string[]
  seenPromotionIds: string[]
  hasHydratedSeenIds: boolean
  setActiveTab: (tab: NotificationTab) => void
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

export const useNotificationsUiStore = create<NotificationsUiState>((set, get) => ({
  activeTab: "noti",
  seenNotificationIds: [],
  seenPromotionIds: [],
  hasHydratedSeenIds: false,
  setActiveTab: (tab) =>
    set({
      activeTab: tab,
    }),
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
      const nextIds = Array.from(
        new Set([...get().seenNotificationIds, ...ids])
      )
      persistIds(SEEN_NOTIFICATION_IDS_STORAGE_KEY, nextIds)

      set({
        seenNotificationIds: nextIds,
      })
      return
    }

    const nextIds = Array.from(new Set([...get().seenPromotionIds, ...ids]))
    persistIds(SEEN_PROMOTION_IDS_STORAGE_KEY, nextIds)

    set({
      seenPromotionIds: nextIds,
    })
  },
}))

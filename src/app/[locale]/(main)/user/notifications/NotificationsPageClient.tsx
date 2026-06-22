"use client"

import { useCallback, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useShallow } from "zustand/react/shallow"

import { NotificationCard } from "@/components/molecules/NotificationCard"
import { useNotificationsPageQuery } from "@/hooks/useNotificationsQuery"
import type { NotificationsPageBundleData } from "@/lib/data/notifications-page"
import { useNotificationsUiStore } from "@/lib/zustand/notifications-ui-store"
import type { NotificationTab } from "@/types/notification"

const TAB_IDS: NotificationTab[] = ["noti", "promo"]
const TAB_QUERY_KEY = "tab"

const TABS: Array<{ id: NotificationTab; label: string }> = [
  { id: "noti", label: "การแจ้งเตือน" },
  { id: "promo", label: "โปรโมชั่น" },
]

function notificationsTabFromQuery(value: string | null): NotificationTab {
  if (value && TAB_IDS.includes(value as NotificationTab)) {
    return value as NotificationTab
  }

  return "noti"
}

type NotificationsPageClientProps = {
  initialData: NotificationsPageBundleData
}

const NotificationsPageClient = ({
  initialData,
}: NotificationsPageClientProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = notificationsTabFromQuery(searchParams.get(TAB_QUERY_KEY))

  const {
    seenNotificationIds,
    seenPromotionIds,
    hasHydratedSeenIds,
    hydrateSeenIds,
    markTabItemsSeen,
  } = useNotificationsUiStore(
    useShallow((state) => ({
      seenNotificationIds: state.seenNotificationIds,
      seenPromotionIds: state.seenPromotionIds,
      hasHydratedSeenIds: state.hasHydratedSeenIds,
      hydrateSeenIds: state.hydrateSeenIds,
      markTabItemsSeen: state.markTabItemsSeen,
    }))
  )

  const notificationsQuery = useNotificationsPageQuery(initialData)
  const bundle = notificationsQuery.data ?? initialData
  const orderNotifications = bundle.notifications
  const promotions = bundle.promotions

  const seenNotificationIdSet = useMemo(
    () => new Set(seenNotificationIds),
    [seenNotificationIds]
  )
  const seenPromotionIdSet = useMemo(
    () => new Set(seenPromotionIds),
    [seenPromotionIds]
  )

  useEffect(() => {
    hydrateSeenIds()
  }, [hydrateSeenIds])

  const setTab = useCallback(
    (tab: NotificationTab) => {
      const params = new URLSearchParams(searchParams.toString())

      if (tab === "noti") {
        params.delete(TAB_QUERY_KEY)
      } else {
        params.set(TAB_QUERY_KEY, tab)
      }

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    if (!hasHydratedSeenIds) {
      return
    }

    const items = activeTab === "noti" ? orderNotifications : promotions
    const seenIds =
      activeTab === "noti" ? seenNotificationIdSet : seenPromotionIdSet
    const unseenIds = items
      .map((item) => item.id)
      .filter((id) => !seenIds.has(id))

    if (!unseenIds.length) {
      return
    }

    markTabItemsSeen(activeTab, unseenIds)
  }, [
    activeTab,
    hasHydratedSeenIds,
    markTabItemsSeen,
    orderNotifications,
    promotions,
    seenNotificationIdSet,
    seenPromotionIdSet,
  ])

  const notiTabHasUnread = useMemo(
    () =>
      orderNotifications.some(
        (notification) => !seenNotificationIdSet.has(notification.id)
      ),
    [orderNotifications, seenNotificationIdSet]
  )

  const promoTabHasUnread = useMemo(
    () => promotions.some((promotion) => !seenPromotionIdSet.has(promotion.id)),
    [promotions, seenPromotionIdSet]
  )

  const activeItems = activeTab === "noti" ? orderNotifications : promotions
  const activeSeenIdSet =
    activeTab === "noti" ? seenNotificationIdSet : seenPromotionIdSet
  const emptyMessage =
    activeTab === "noti" ? "ไม่มีการแจ้งเตือนใหม่" : "ไม่มีโปรโมชั่นใหม่"

  return (
    <div className="lg:bg-sop-base-white rounded-lg w-full h-full">
      <div className="p-4 border-b border-sop-neutral-grayalpha-300 md:block hidden">
        <h1 className="sop-headline-sm-medium">การแจ้งเตือน</h1>
      </div>

      <div className="p-2 md:p-4">
        <div className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap snap-x snap-mandatory touch-pan-x overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const hasUnread =
              tab.id === "noti" ? notiTabHasUnread : promoTabHasUnread

            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                type="button"
                className={`
                  relative h-sop-32px px-3 py-2 transition-all shrink-0 snap-start
                  flex items-center justify-center rounded-[8px] sop-body-sm-medium
                  ${
                    activeTab === tab.id
                      ? "bg-sop-primary-500 text-sop-neutral-grayfixed-600"
                      : "bg-sop-base-white border border-sop-neutral-grayalpha-300 text-sop-neutral-gray-200"
                  }
                `}
              >
                {tab.label}
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col w-full pb-4">
        {activeItems.length > 0 ? (
          activeItems.map((item) => (
            <NotificationCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              date={item.dateLabel}
              image={item.image}
              isUnread={!activeSeenIdSet.has(item.id)}
              href={item.href}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPageClient

"use client"

import { useCallback, useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
  const activeTab = useNotificationsUiStore((state) => state.activeTab)
  const setActiveTab = useNotificationsUiStore((state) => state.setActiveTab)
  const seenNotificationIds = useNotificationsUiStore(
    (state) => state.seenNotificationIds
  )
  const seenPromotionIds = useNotificationsUiStore(
    (state) => state.seenPromotionIds
  )
  const hasHydratedSeenIds = useNotificationsUiStore(
    (state) => state.hasHydratedSeenIds
  )
  const hydrateSeenIds = useNotificationsUiStore(
    (state) => state.hydrateSeenIds
  )
  const markTabItemsSeen = useNotificationsUiStore(
    (state) => state.markTabItemsSeen
  )

  const notificationsQuery = useNotificationsPageQuery(initialData)
  const bundle = notificationsQuery.data ?? initialData
  const orderNotifications = bundle.notifications
  const promotions = bundle.promotions
  const activeTabFromQuery = notificationsTabFromQuery(
    searchParams.get(TAB_QUERY_KEY)
  )

  useEffect(() => {
    hydrateSeenIds()
  }, [hydrateSeenIds])

  useEffect(() => {
    if (activeTab !== activeTabFromQuery) {
      setActiveTab(activeTabFromQuery)
    }
  }, [activeTab, activeTabFromQuery, setActiveTab])

  const setTab = useCallback(
    (tab: NotificationTab) => {
      setActiveTab(tab)
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
    [pathname, router, searchParams, setActiveTab]
  )

  const orderNotificationIds = useMemo(
    () => orderNotifications.map((notification) => notification.id),
    [orderNotifications]
  )

  const promotionIds = useMemo(
    () => promotions.map((promotion) => promotion.id),
    [promotions]
  )

  useEffect(() => {
    if (!hasHydratedSeenIds) {
      return
    }

    if (activeTab === "noti") {
      markTabItemsSeen("noti", orderNotificationIds)
      return
    }

    markTabItemsSeen("promo", promotionIds)
  }, [
    activeTab,
    hasHydratedSeenIds,
    markTabItemsSeen,
    orderNotificationIds,
    promotionIds,
  ])

  const notiTabHasUnread = useMemo(
    () =>
      orderNotifications.some(
        (notification) => !seenNotificationIds.includes(notification.id)
      ),
    [orderNotifications, seenNotificationIds]
  )

  const promoTabHasUnread = useMemo(
    () => promotions.some((promotion) => !seenPromotionIds.includes(promotion.id)),
    [promotions, seenPromotionIds]
  )

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
        {activeTab === "noti" ? (
          orderNotifications.length > 0 ? (
            orderNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                id={notification.id}
                title={notification.title}
                description={notification.description}
                date={notification.dateLabel}
                image={notification.image}
                isUnread={!seenNotificationIds.includes(notification.id)}
                href={notification.href}
              />
            ))
          ) : (
            <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
              ไม่มีการแจ้งเตือนใหม่
            </div>
          )
        ) : promotions.length > 0 ? (
          promotions.map((promotion) => (
            <NotificationCard
              key={promotion.id}
              id={promotion.id}
              title={promotion.title}
              description={promotion.description}
              date={promotion.dateLabel}
              image={promotion.image}
              isUnread={!seenPromotionIds.includes(promotion.id)}
              href={promotion.href}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
            ไม่มีโปรโมชั่นใหม่
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPageClient

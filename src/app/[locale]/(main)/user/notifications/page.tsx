"use client"

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { NotificationCard } from "@/components/molecules/NotificationCard"
import { listOrders } from "@/lib/data/orders"
import { listCampaigns, type CampaignListItem } from "@/lib/data/campaigns"
import { fetchCoupons, type CouponApiData } from "@/lib/data/coupons"

type NotificationTab = "noti" | "promo"

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

const LIMIT = 10

type NotificationOrder = Awaited<ReturnType<typeof listOrders>>[number]

type PromotionNotification = {
  id: string
  title: string
  description: string
  date: string
  image: string
  isUnread: boolean
  href: string
}

const PROMO_NEW_MS = 7 * 24 * 60 * 60 * 1000

const TH_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

const isPromotionUnread = (dateString?: string | null) => {
  if (!dateString) return false
  const promoDate = new Date(dateString).getTime()
  const now = Date.now()
  return now - promoDate < PROMO_NEW_MS
}

function mapCampaignsAndCouponsToPromotions(
  newCampaigns: CampaignListItem[],
  newCoupons: CouponApiData[]
): PromotionNotification[] {
  return [
    ...newCampaigns.map((campaign) => ({
      id: `camp_${campaign.id}`,
      title: campaign.name || "โปรโมชั่นพิเศษ",
      description: campaign.description || "รายละเอียดโปรโมชั่น",
      date: campaign.created_at
        ? new Date(campaign.created_at).toLocaleString("th-TH", TH_DATE_TIME)
        : "",
      image: "/images/placeholder.svg",
      isUnread: isPromotionUnread(campaign.created_at),
      href: "/coupons",
    })),
    ...newCoupons.map((coupon) => ({
      id: `coup_${coupon.id}`,
      title: coupon.title || `โค้ดส่วนลด: ${coupon.code}`,
      description:
        coupon.description || `ใช้โค้ด ${coupon.code} เพื่อรับส่วนลด`,
      date: coupon.expiry_date ? `ใช้ได้ถึง: ${coupon.expiry_date}` : "",
      image: "/images/placeholder.svg",
      isUnread: false,
      href: "/coupons",
    })),
  ]
}

function getOrderNotificationCopy(order: NotificationOrder): {
  title: string
  description: string
} {
  const orderStatus = String(order.status || "")
  const fulfillmentStatus = String(order.fulfillment_status || "")
  const paymentStatus =
    order.metadata?.is_paid === true
      ? "captured"
      : String(order.payment_status || "")
  const displayId = order.display_id

  if (orderStatus === "canceled") {
    return {
      title: "คำสั่งซื้อของคุณถูกยกเลิก",
      description: `คำสั่งซื้อหมายเลข ${displayId} ถูกยกเลิก`,
    }
  }
  if (
    orderStatus === "completed" ||
    fulfillmentStatus === "shipped" ||
    fulfillmentStatus === "fulfilled"
  ) {
    return {
      title: "คำสั่งซื้อของคุณ ส่งสำเร็จแล้ว",
      description: `คำสั่งซื้อหมายเลข ${displayId} ส่งสำเร็จแล้ว`,
    }
  }
  if (paymentStatus === "captured" || fulfillmentStatus !== "not_fulfilled") {
    return {
      title: "คำสั่งซื้อของคุณ กำลังเตรียมการจัดส่ง",
      description: `ผู้ขายได้รับคำสั่งซื้อหมายเลข ${displayId} แล้ว กำลังเตรียมการจัดส่ง`,
    }
  }
  if (
    paymentStatus === "pending" ||
    paymentStatus === "not_paid" ||
    paymentStatus === "awaiting"
  ) {
    return {
      title: "คำสั่งซื้อของคุณรอการชำระเงิน",
      description: `คำสั่งซื้อหมายเลข ${displayId} รอการชำระเงิน`,
    }
  }
  return {
    title: "คำสั่งซื้อของคุณ",
    description: `อัปเดตสถานะคำสั่งซื้อหมายเลข ${displayId}`,
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = notificationsTabFromQuery(searchParams.get(TAB_QUERY_KEY))

  const setTab = useCallback(
    (id: NotificationTab) => {
      const params = new URLSearchParams(searchParams.toString())
      if (id === "noti") {
        params.delete(TAB_QUERY_KEY)
      } else {
        params.set(TAB_QUERY_KEY, id)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams]
  )

  // Orders State
  const [orders, setOrders] = useState<NotificationOrder[]>([])
  const [ordersOffset, setOrdersOffset] = useState(0)
  const [ordersHasMore, setOrdersHasMore] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [initialOrdersLoaded, setInitialOrdersLoaded] = useState(false)

  // Promotions State
  const [promotions, setPromotions] = useState<PromotionNotification[]>([])
  const [promosOffset, setPromosOffset] = useState(0)
  const [promosHasMore, setPromosHasMore] = useState(true)
  const [loadingPromos, setLoadingPromos] = useState(false)
  const [initialPromosLoaded, setInitialPromosLoaded] = useState(false)

  // Local storage state for read notifications (Orders)
  const [readOrderIds, setReadOrderIds] = useState<string[]>([])

  const handleOrderClick = useCallback((id: string) => {
    setReadOrderIds((prev) => {
      if (prev.includes(id)) return prev
      const nextIds = [...prev, id]
      try {
        localStorage.setItem("sopet_read_orders", JSON.stringify(nextIds))
      } catch {}
      return nextIds
    })
  }, [])

  const fetchOrders = useCallback(async (offset: number) => {
    setLoadingOrders(true)
    try {
      const data = await listOrders(LIMIT, offset)
      if (data && Array.isArray(data)) {
        if (offset === 0) {
          setOrders(data)
          setOrdersHasMore(data.length === LIMIT)
        } else {
          setOrders((prev) => {
            const prevIds = new Set(prev.map((p) => p.id))
            const newUnique = data.filter((order) => !prevIds.has(order.id))

            // Safety measure: if data was returned but nothing is new, pagination is broken/done
            if (newUnique.length === 0) {
              setOrdersHasMore(false)
            } else if (data.length < LIMIT) {
              setOrdersHasMore(false)
            } else {
              setOrdersHasMore(true)
            }

            return [...prev, ...newUnique]
          })
        }
      } else {
        setOrdersHasMore(false)
      }
    } catch (e) {
      console.error("Failed to fetch orders for notifications:", e)
    } finally {
      setLoadingOrders(false)
      setInitialOrdersLoaded(true)
    }
  }, [])

  const fetchPromotions = useCallback(async (offset: number) => {
    setLoadingPromos(true)
    try {
      const [campaignsData, couponsData] = await Promise.all([
        listCampaigns(LIMIT, offset),
        fetchCoupons(undefined, LIMIT, offset),
      ])

      const newCampaigns = campaignsData || []
      const newCoupons = couponsData || []
      const combined = mapCampaignsAndCouponsToPromotions(
        newCampaigns,
        newCoupons
      )

      if (offset === 0) {
        setPromotions(combined)
        setPromosHasMore(
          !(newCampaigns.length < LIMIT && newCoupons.length < LIMIT)
        )
      } else {
        setPromotions((prev) => {
          const prevIds = new Set(prev.map((p) => p.id))
          const newUnique = combined.filter(
            (promotion) => !prevIds.has(promotion.id)
          )

          if (newUnique.length === 0) {
            setPromosHasMore(false)
          } else if (newCampaigns.length < LIMIT && newCoupons.length < LIMIT) {
            setPromosHasMore(false)
          } else {
            setPromosHasMore(true)
          }

          return [...prev, ...newUnique]
        })
      }
    } catch (e) {
      console.error("Failed to fetch promotions:", e)
    } finally {
      setLoadingPromos(false)
      setInitialPromosLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchOrders(0)
    try {
      const stored = localStorage.getItem("sopet_read_orders")
      if (stored) {
        setReadOrderIds(JSON.parse(stored))
      }
    } catch {}
  }, [fetchOrders])

  useEffect(() => {
    if (activeTab !== "promo") return
    if (initialPromosLoaded || loadingPromos) return
    fetchPromotions(0)
  }, [activeTab, fetchPromotions, initialPromosLoaded, loadingPromos])

  const observer = useRef<IntersectionObserver | null>(null)
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      const loading = activeTab === "noti" ? loadingOrders : loadingPromos
      const hasMore = activeTab === "noti" ? ordersHasMore : promosHasMore

      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          if (activeTab === "noti") {
            const newOffset = ordersOffset + LIMIT
            setOrdersOffset(newOffset)
            fetchOrders(newOffset)
          } else {
            const newOffset = promosOffset + LIMIT
            setPromosOffset(newOffset)
            fetchPromotions(newOffset)
          }
        }
      })

      if (node) observer.current.observe(node)
    },
    [
      loadingOrders,
      loadingPromos,
      activeTab,
      ordersHasMore,
      promosHasMore,
      ordersOffset,
      promosOffset,
      fetchOrders,
      fetchPromotions,
    ]
  )

  const notiTabHasUnread = useMemo(
    () => orders.length > 0 && !readOrderIds.includes(orders[0].id),
    [orders, readOrderIds]
  )

  const promoTabHasUnread = useMemo(
    () => promotions.some((p) => p.isUnread),
    [promotions]
  )

  const renderNotifications = () => {
    if (!initialOrdersLoaded) {
      return (
        <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
          กำลังโหลด...
        </div>
      )
    }

    if (!orders || orders.length === 0) {
      return (
        <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
          ไม่มีการแจ้งเตือนใหม่
        </div>
      )
    }

    return (
      <>
        {orders.map((order, index) => {
          const { title, description } = getOrderNotificationCopy(order)
          const isLatestOrder = index === 0
          const isUnread = isLatestOrder && !readOrderIds.includes(order.id)

          const image = order.items?.[0]?.thumbnail || "/images/placeholder.svg"
          const date = new Date(order.created_at).toLocaleString(
            "th-TH",
            TH_DATE_TIME
          )

          const isLast = index === orders.length - 1

          return (
            <div key={order.id} ref={isLast ? lastElementRef : null}>
              <NotificationCard
                id={order.id}
                title={title}
                description={description}
                date={date}
                image={image}
                isUnread={isUnread}
                href={`/user/orders/${order.id}`}
                onClick={() => handleOrderClick(order.id)}
              />
            </div>
          )
        })}
        {loadingOrders && orders.length > 0 && (
          <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
            กำลังโหลดเพิ่มเติม...
          </div>
        )}
      </>
    )
  }

  const renderPromotions = () => {
    if (!initialPromosLoaded) {
      return (
        <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
          กำลังโหลด...
        </div>
      )
    }

    if (!promotions || promotions.length === 0) {
      return (
        <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
          ไม่มีโปรโมชั่นใหม่
        </div>
      )
    }

    return (
      <>
        {promotions.map((promo, index) => {
          const isLast = index === promotions.length - 1
          return (
            <div key={promo.id} ref={isLast ? lastElementRef : null}>
              <NotificationCard
                id={promo.id}
                title={promo.title}
                description={promo.description}
                date={promo.date}
                image={promo.image}
                isUnread={promo.isUnread}
                href={promo.href}
              />
            </div>
          )
        })}
        {loadingPromos && promotions.length > 0 && (
          <div className="p-4 text-center text-sop-neutral-gray-400 sop-body-sm-regular">
            กำลังโหลดเพิ่มเติม...
          </div>
        )}
      </>
    )
  }

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
        {activeTab === "noti" ? renderNotifications() : renderPromotions()}
      </div>
    </div>
  )
}

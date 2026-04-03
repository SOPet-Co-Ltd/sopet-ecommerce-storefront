"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { NotificationCard } from "@/components/molecules/NotificationCard"
import { listOrders } from "@/lib/data/orders"
import { listCampaigns, type CampaignListItem } from "@/lib/data/campaigns"
import { fetchCoupons, type CouponApiData } from "@/lib/data/coupons"

const TABS = [
  { id: "noti", label: "การแจ้งเตือน" },
  { id: "promo", label: "โปรโมชั่น" },
]

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

const isPromotionUnread = (dateString?: string | null) => {
  if (!dateString) return false
  const promoDate = new Date(dateString).getTime()
  const now = new Date().getTime()
  // Assuming 'new' is within the last 7 days
  return now - promoDate < 7 * 24 * 60 * 60 * 1000
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("noti")

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

  useEffect(() => {
    fetchOrders(0)
    fetchPromotions(0)

    // Load read order IDs on mount
    try {
      const stored = localStorage.getItem("sopet_read_orders")
      if (stored) {
        setReadOrderIds(JSON.parse(stored))
      }
    } catch {}
  }, [])

  const handleOrderClick = (id: string) => {
    if (!readOrderIds.includes(id)) {
      const nextIds = [...readOrderIds, id]
      setReadOrderIds(nextIds)
      localStorage.setItem("sopet_read_orders", JSON.stringify(nextIds))
    }
  }

  const fetchOrders = async (offset: number) => {
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
  }

  const fetchPromotions = async (offset: number) => {
    setLoadingPromos(true)
    try {
      const [campaignsData, couponsData] = await Promise.all([
        listCampaigns(LIMIT, offset),
        fetchCoupons(undefined, LIMIT, offset),
      ])

      const newCampaigns = campaignsData || []
      const newCoupons = couponsData || []
      const combined: PromotionNotification[] = [
        ...newCampaigns.map((campaign: CampaignListItem) => ({
          id: `camp_${campaign.id}`,
          title: campaign.name || "โปรโมชั่นพิเศษ",
          description: campaign.description || "รายละเอียดโปรโมชั่น",
          date: campaign.created_at
            ? new Date(campaign.created_at).toLocaleString("th-TH", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          image: "/images/placeholder.svg",
          isUnread: isPromotionUnread(campaign.created_at),
          href: "/coupons",
        })),
        ...newCoupons.map((coupon: CouponApiData) => ({
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
  }

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
    ]
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
          let title = "คำสั่งซื้อของคุณ"
          let description = ""
          let isUnread = false
          const orderStatus = String(order.status || "")
          const fulfillmentStatus = String(order.fulfillment_status || "")
          const paymentStatus = String(order.payment_status || "")

          // เอาเฉพาะ order ล่าสุด เท่านั้นที่จะเช็คสถานะการแจ้งเตือน
          const isLatestOrder = index === 0

          if (isLatestOrder && !readOrderIds.includes(order.id)) {
            isUnread = true
          }

          if (orderStatus === "canceled") {
            title = "คำสั่งซื้อของคุณถูกยกเลิก"
            description = `คำสั่งซื้อหมายเลข ${order.display_id} ถูกยกเลิก`
          } else if (
            orderStatus === "completed" ||
            fulfillmentStatus === "shipped" ||
            fulfillmentStatus === "fulfilled"
          ) {
            title = "คำสั่งซื้อของคุณ ส่งสำเร็จแล้ว"
            description = `คำสั่งซื้อหมายเลข ${order.display_id} ส่งสำเร็จแล้ว`
          } else if (
            paymentStatus === "captured" ||
            fulfillmentStatus !== "not_fulfilled"
          ) {
            title = "คำสั่งซื้อของคุณ กำลังเตรียมการจัดส่ง"
            description = `ผู้ขายได้รับคำสั่งซื้อหมายเลข ${order.display_id} แล้ว กำลังเตรียมการจัดส่ง`
          } else if (
            paymentStatus === "pending" ||
            paymentStatus === "not_paid" ||
            paymentStatus === "awaiting"
          ) {
            title = "คำสั่งซื้อของคุณรอการชำระเงิน"
            description = `คำสั่งซื้อหมายเลข ${order.display_id} รอการชำระเงิน`
          } else {
            description = `อัปเดตสถานะคำสั่งซื้อหมายเลข ${order.display_id}`
          }

          const image = order.items?.[0]?.thumbnail || "/images/placeholder.svg"
          const date = new Date(order.created_at).toLocaleString("th-TH", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })

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
              tab.id === "noti"
                ? orders.length > 0 && !readOrderIds.includes(orders[0].id)
                : promotions.some((p) => p.isUnread)

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

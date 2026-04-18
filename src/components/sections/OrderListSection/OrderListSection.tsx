"use client"

import { Button } from "@/components/atoms/Button/Button"
import OrderCard from "@/components/molecules/OrderCard/OrderCard"
import { useEffect, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { OrderListItem } from "@/types/order"
import { sliceOrder } from "@/lib/helpers/order-slicer"
import {
  OrderManagementTab,
  useOrderManagementUiStore,
} from "@/lib/zustand/order-management-ui-store"

const TAB_IDS: OrderManagementTab[] = [
  "all",
  "to-pay",
  "to-ship",
  "to-receive",
  "completed",
  "cancelled",
]

const TABS: Array<{ id: OrderManagementTab; label: string }> = [
  { id: "all", label: "ทั้งหมด" },
  { id: "to-pay", label: "ที่ต้องชำระ" },
  { id: "to-ship", label: "เตรียมการจัดส่ง" },
  { id: "to-receive", label: "ที่ต้องได้รับ" },
  { id: "completed", label: "ส่งสำเร็จ" },
  { id: "cancelled", label: "ยกเลิก/คืนสินค้า" },
]

const TAB_QUERY_KEY = "tab"

function tabFromQuery(value: string | null): OrderManagementTab {
  if (value && TAB_IDS.includes(value as OrderManagementTab)) {
    return value as OrderManagementTab
  }
  return "all"
}

type OrderListSectionProps = {
  orders: OrderListItem[]
  reviewedByOrderId?: Record<string, boolean>
}

const ORDERS_INITIAL_TAB_KEY = "orders_initial_tab"

const OrderListSection = ({
  orders,
  reviewedByOrderId,
}: OrderListSectionProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = useOrderManagementUiStore((state) => state.activeTab)
  const setActiveTab = useOrderManagementUiStore((state) => state.setActiveTab)

  const activeTabFromQuery = tabFromQuery(searchParams.get(TAB_QUERY_KEY))

  useEffect(() => {
    if (typeof window === "undefined") return
    const initialTab = sessionStorage.getItem(ORDERS_INITIAL_TAB_KEY)
    if (initialTab === "to-pay") {
      sessionStorage.removeItem(ORDERS_INITIAL_TAB_KEY)
      router.replace(`${pathname}?${TAB_QUERY_KEY}=to-pay`)
    }
  }, [pathname, router])

  useEffect(() => {
    if (activeTab !== activeTabFromQuery) {
      setActiveTab(activeTabFromQuery)
    }
  }, [activeTab, activeTabFromQuery, setActiveTab])

  const setTab = (id: OrderManagementTab) => {
    setActiveTab(id)
    const params = new URLSearchParams(searchParams.toString())
    if (id === "all") {
      params.delete(TAB_QUERY_KEY)
    } else {
      params.set(TAB_QUERY_KEY, id)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  const slicedOrders = useMemo(() => {
    return orders.flatMap((order) => sliceOrder(order as any))
  }, [orders])

  const filteredOrders = useMemo(() => {
    const list = activeTab === "all" ? slicedOrders : slicedOrders.filter((order) => {
      const displayStatus = order.slice_display_status

      switch (activeTab) {
        case "to-pay":
          return displayStatus === "to-pay"
        case "to-ship":
          return displayStatus === "preparing"
        case "to-receive":
          return displayStatus === "to-receive"
        case "completed":
          return displayStatus === "completed"
        case "cancelled":
          return displayStatus === "cancelled"
        default:
          return true
      }
    })

    return list
  }, [slicedOrders, activeTab])

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap snap-x snap-mandatory touch-pan-x overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:px-0 px-4">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            variant={activeTab === tab.id ? "primary" : "neutral"}
            size="sm"
            rounded="rounded"
            className="min-w-auto"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Order List */}
      <div className="flex flex-col gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const hasAnyReviewed = reviewedByOrderId?.[order.original_order_id] ?? false

            return (
              <OrderCard
                key={`${order.original_order_id}-${order.seller_id}`}
                order={order as any}
                hasAnyReviewed={hasAnyReviewed}
              />
            )
          })
        ) : (
          <div className="text-center py-14 bg-sop-base-white">
            <p className="sop-body-lg-regular text-sop-neutral-gray-300">
              ไม่พบคำสั่งซื้อในสถานะนี้
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderListSection

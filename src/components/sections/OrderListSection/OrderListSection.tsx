"use client"

import { Button } from "@/components/atoms/Button/Button"
import OrderCard from "@/components/molecules/OrderCard/OrderCard"
import { useMemo, useState } from "react"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"
import type { OrderListItem } from "@/types/order"

type OrderTab =
  | "all"
  | "to-pay"
  | "to-ship"
  | "to-receive"
  | "completed"
  | "cancelled"

const TABS: Array<{ id: OrderTab; label: string }> = [
  { id: "all", label: "ทั้งหมด" },
  { id: "to-pay", label: "ที่ต้องชำระ" },
  { id: "to-ship", label: "เตรียมการจัดส่ง" },
  { id: "to-receive", label: "ที่ต้องได้รับ" },
  { id: "completed", label: "ส่งสำเร็จ" },
  { id: "cancelled", label: "ยกเลิก/คืนสินค้า" },
]

type OrderListSectionProps = {
  orders: OrderListItem[]
  reviewedByOrderId?: Record<string, boolean>
}

const OrderListSection = ({
  orders,
  reviewedByOrderId,
}: OrderListSectionProps) => {
  const [activeTab, setActiveTab] = useState<OrderTab>("all")

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders

    return orders.filter((order) => {
      const displayStatus = getOrderDisplayStatus(order)

      if (activeTab === "to-pay") {
        return displayStatus === "to-pay"
      }
      if (activeTab === "to-ship") {
        return displayStatus === "preparing"
      }
      if (activeTab === "to-receive") {
        return displayStatus === "to-receive"
      }
      if (activeTab === "completed") {
        return displayStatus === "completed"
      }
      if (activeTab === "cancelled") {
        return displayStatus === "cancelled"
      }
      return true
    })
  }, [orders, activeTab])

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap snap-x snap-mandatory touch-pan-x overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:px-0 px-4">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            const hasAnyReviewed = reviewedByOrderId?.[order.id] ?? false

            return (
              <OrderCard
                key={order.id}
                order={order}
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

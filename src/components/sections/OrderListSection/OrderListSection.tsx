"use client"

import { Button } from "@/components/atoms"
import { OrderCard } from "@/components/molecules"
import { useMemo, useState } from "react"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"

const TABS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "to-pay", label: "ที่ต้องชำระ" },
  { id: "to-ship", label: "เตรียมการจัดส่ง" },
  { id: "to-receive", label: "ที่ต้องได้รับ" },
  { id: "completed", label: "ส่งสำเร็จ" },
  { id: "cancelled", label: "ยกเลิก/คืนสินค้า" },
]

type OrderListSectionProps = {
  orders: any[]
}

const OrderListSection = ({ orders }: OrderListSectionProps) => {
  const [activeTab, setActiveTab] = useState("all")

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
      <div className="flex w-full items-center gap-2 overflow-x-auto whitespace-nowrap snap-x snap-mandatory touch-pan-x overscroll-x-contain scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
            className={`
              h-sop-32px px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 snap-start
              flex items-center justify-center
              ${
                activeTab === tab.id
                  ? "bg-sop-primary-500 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-[#211f23] hover:bg-gray-50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="flex flex-col gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <div className="text-center py-10 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-500">ไม่พบคำสั่งซื้อในสถานะนี้</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderListSection

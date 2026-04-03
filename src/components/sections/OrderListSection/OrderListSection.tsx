"use client"

import { Button } from "@/components/atoms"
import { OrderCard } from "@/components/molecules"
import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import { getOrderDisplayStatus } from "@/lib/helpers/order-status"
import { listOrders } from "@/lib/data/orders"
import { Loader2 } from "lucide-react"

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

const OrderListSection = ({ orders: initialOrders }: OrderListSectionProps) => {
  const [activeTab, setActiveTab] = useState("all")
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [offset, setOffset] = useState(initialOrders.length)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialOrders.length >= 20)
  
  const observer = useRef<IntersectionObserver | null>(null)
  const lastOrderElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return
    if (observer.current) observer.current.disconnect()
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    
    if (node) observer.current.observe(node)
  }, [isLoading, hasMore])

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return
    
    setIsLoading(true)
    try {
      const limit = 20
      const newOrders = await listOrders(limit, offset)
      if (newOrders && newOrders.length > 0) {
        setOrders(prev => [...prev, ...newOrders])
        setOffset(prev => prev + newOrders.length)
        if (newOrders.length < limit) {
          setHasMore(false)
        }
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error("Failed to load more orders:", error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, offset])

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders

    return orders.filter((order) => {
      const displayStatus = getOrderDisplayStatus(order)
      
      switch (activeTab) {
        case "to-pay": return displayStatus === "to-pay"
        case "to-ship": return displayStatus === "preparing"
        case "to-receive": return displayStatus === "to-receive"
        case "completed": return displayStatus === "completed"
        case "cancelled": return displayStatus === "cancelled"
        default: return true
      }
    })
  }, [orders, activeTab])

  // If we're on a tab and it's empty but there's more to load, keep loading
  useEffect(() => {
    if (activeTab !== "all" && filteredOrders.length === 0 && hasMore && !isLoading) {
      loadMore()
    }
  }, [activeTab, filteredOrders.length, hasMore, isLoading, loadMore])

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
              h-sop-32px px-3 py-2  transition-all shrink-0 snap-start
              flex items-center justify-center rounded-[8px] sop-body-sm-medium
              ${
                activeTab === tab.id
                  ? "bg-sop-primary-500 text-sop-neutral-grayfixed-600"
                  : "bg-sop-neutral-grayalpha-100 text-sop-neutral-gray-200"
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
          <>
            {filteredOrders.map((order, index) => (
              <div 
                key={order.id} 
                ref={index === filteredOrders.length - 1 ? lastOrderElementRef : null}
              >
                <OrderCard order={order} />
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-sop-primary-500" />
              </div>
            )}
          </>
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

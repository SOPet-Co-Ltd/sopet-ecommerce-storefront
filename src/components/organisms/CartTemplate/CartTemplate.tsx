"use client"

import { Button, Checkbox } from "@/components/atoms"
import { CartItem } from "@/components/molecules"
import { convertToLocale } from "@/lib/helpers/money"
import { CartSummary } from "../CartSummary/CartSummary"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { mockCart } from "@/lib/mocks/cart"
import { Ticket, Trash } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import { TrashIcon, PlusLineIcon, MinusIcon, TicketSaleIcon } from "@/icons"
import { Cart } from "@/types/cart"

type ProductWithSeller = HttpTypes.StoreProduct & {
  seller?: { store_name: string }
}

// Using any for flexibility with mock data during this phase
export const CartTemplate = ({
  cart,
}: {
  cart: HttpTypes.StoreCart | Cart
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh()
      }
    }

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        router.refresh()
      }
    }

    window.addEventListener("pageshow", handlePageShow)
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    return () => {
      window.removeEventListener("pageshow", handlePageShow)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
    }
  }, [router])

  const sortedItems = useMemo(() => {
    const items = [...(cart?.items || [])]
    return items.sort((a, b) => {
      const aKey = String(a.created_at || a.id || "")
      const bKey = String(b.created_at || b.id || "")
      return aKey.localeCompare(bKey)
    })
  }, [cart?.items])

  // Group items by seller
  const itemsBySeller = sortedItems.reduce(
    (acc: Record<string, HttpTypes.StoreCartLineItem[]>, item) => {
      const sellerName =
        (item.product as ProductWithSeller)?.seller?.store_name || "SOPet"
      if (!acc[sellerName]) {
        acc[sellerName] = []
      }
      acc[sellerName].push(item)
      return acc
    },
    {} as Record<string, HttpTypes.StoreCartLineItem[]>
  )

  const allItemIds = sortedItems.map((i) => i.id)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(allItemIds)
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => [...prev, id])
    } else {
      setSelectedItems((prev) => prev.filter((i) => i !== id))
    }
  }

  const handleSelectSeller = (sellerName: string, checked: boolean) => {
    const sellerItems = itemsBySeller[sellerName]?.map((i) => i.id) || []
    if (checked) {
      setSelectedItems((prev) => [...new Set([...prev, ...sellerItems])])
    } else {
      setSelectedItems((prev) => prev.filter((id) => !sellerItems.includes(id)))
    }
  }

  // Calculate selected total
  const selectedTotal =
    sortedItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((acc, item) => acc + (item.total ?? 0), 0) || 0

  if (!cart || !cart.items?.length) {
    return (
      <div className="container mx-auto py-20 text-center px-4">
        <h1 className="heading-xl mb-4">Your Cart is Empty</h1>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-[180px] font-mitr">
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-medium text-gray-900">
            ตะกร้าสินค้า
          </h1>
        </div>

        <div className="flex gap-6">
          <div className=" flex flex-col gap-4 w-full">
            {/* Select All Header */}
            {/* <div className="bg-white px-4 md:px-6 py-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <Checkbox
                checked={
                  selectedItems.length === allItemIds.length &&
                  allItemIds.length > 0
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="text-body-lg font-medium text-gray-900">
                เลือกทั้งหมด
              </span>
              <div className="ml-auto">
                <button className="flex items-center gap-1 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors">
                  <Trash className="w-4 h-4 md:hidden" />
                  <span className="hidden md:inline">ลบรายการที่เลือก</span>
                </button>
              </div>
            </div> */}

            {/* Cart Items Grouped by Seller */}
            {Object.entries(itemsBySeller).map(([sellerName, items]) => {
              const isSellerSelected = items.every((i) =>
                selectedItems.includes(i.id)
              )
              return (
                <div
                  key={sellerName}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                >
                  <div className="px-4 md:px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
                    <Checkbox
                      checked={isSellerSelected}
                      onChange={(e) =>
                        handleSelectSeller(sellerName, e.target.checked)
                      }
                    />
                    <span className="text-body-lg font-bold text-gray-900">
                      {sellerName}
                    </span>
                  </div>
                  <div className="px-4 md:px-6">
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        currencyCode={cart.currency_code || "THB"}
                        isSelected={selectedItems.includes(item.id)}
                        onSelect={handleSelectItem}
                      />
                    ))}
                  </div>
                  {/* Store Discount Section (Footer) */}
                  <div className="w-full justify-between p-4 border-t border-gray-100 flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center">
                        <TicketSaleIcon size={26} color="#9C6ADE" />
                      </div>
                      <span className="text-body-lg-regular text-sop-primary-500">
                        ส่วนลดร้านค้า
                      </span>
                    </div>
                    <button className="text-sop-neutral-gray-300 ml-auto md:ml-2 text-xs md:text-sm font-medium hover:underline">
                      ดูส่วนลดอื่นๆ
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
          <div className="container mx-auto px-4 md:px-6">
            <div className="pointer-events-auto">
              <CartSummary
                cart={cart}
                selectedCount={selectedItems.length}
                totalCount={cart?.items?.length || 0}
                isAllSelected={
                  selectedItems.length === allItemIds.length &&
                  allItemIds.length > 0
                }
                onSelectAll={handleSelectAll}
                customTotal={selectedTotal}
                selectedItemIds={selectedItems}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

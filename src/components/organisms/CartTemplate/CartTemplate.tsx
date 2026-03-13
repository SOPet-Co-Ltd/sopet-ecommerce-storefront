"use client"

import { Checkbox } from "@/components/atoms"
import { CartItem } from "@/components/molecules"
import { CartSummary } from "../CartSummary/CartSummary"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { DiscountIcon, TicketSaleIcon } from "@/icons"
import { Cart } from "@/types/cart"
import { DiscountModal } from "@/components/molecules/DiscountModal/DiscountModal"

type ProductWithSeller = HttpTypes.StoreProduct & {
  seller?: { name?: string; store_name?: string }
}

// Using any for flexibility with mock data during this phase
export const CartTemplate = ({
  cart,
}: {
  cart: HttpTypes.StoreCart | Cart
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [discountModalVendor, setDiscountModalVendor] = useState<string | null>(
    null
  )
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

  // Track a stable order of line item IDs so variant changes (implemented as delete+create)
  // can keep the visual order by replacing the old ID with the new one.
  const [lineOrder, setLineOrder] = useState<string[]>([])

  useEffect(() => {
    const items = cart?.items || []
    const newIds = items.map((i) => i.id)

    if (!newIds.length) {
      setLineOrder([])
      setSelectedItems([])
      return
    }

    setLineOrder((prevOrder) => {
      if (!prevOrder.length) {
        return newIds
      }

      const prevSet = new Set(prevOrder)
      const removed = prevOrder.filter((id) => !newIds.includes(id))
      const added = newIds.filter((id) => !prevSet.has(id))

      // If the set of IDs hasn't changed, treat as a pure update (e.g. quantity change)
      // and keep the existing visual order.
      if (removed.length === 0 && added.length === 0) {
        return prevOrder
      }

      // Heuristic: one removed + one added -> treat as in-place replacement (e.g. variant change)
      if (removed.length === 1 && added.length === 1) {
        const [removedId] = removed
        const [addedId] = added

        const nextOrder = prevOrder.map((id) =>
          id === removedId ? addedId : id
        )

        // Migrate selection from old ID to new ID
        setSelectedItems((prevSelected) => {
          if (!prevSelected.includes(removedId)) return prevSelected
          const nextSelected = prevSelected.map((id) =>
            id === removedId ? addedId : id
          )
          return Array.from(new Set(nextSelected))
        })

        return nextOrder
      }

      // For other changes (e.g. new items added/removed), fall back to current backend order
      return newIds
    })
  }, [cart?.items])

  const sortedItems = useMemo(() => {
    const items = cart?.items || []
    if (!items.length) return []

    const byId = new Map(items.map((i) => [i.id, i]))
    const ordered: HttpTypes.StoreCartLineItem[] = []
    const seen = new Set<string>()

    // First, respect our tracked lineOrder
    for (const id of lineOrder) {
      const item = byId.get(id)
      if (item) {
        ordered.push(item)
        seen.add(id)
      }
    }

    // Then append any items not yet in lineOrder (e.g. brand new items)
    for (const item of items) {
      if (!seen.has(item.id)) {
        ordered.push(item)
      }
    }

    return ordered
  }, [cart?.items, lineOrder])

  // Group items by seller
  const itemsBySeller = sortedItems.reduce(
    (acc: Record<string, HttpTypes.StoreCartLineItem[]>, item) => {
      // Safely probe various possible locations for the vendor name based on Medusa extensions
      const prod = item.product as any
      const sellerName =
        prod?.seller?.name ||
        prod?.store?.name ||
        prod?.collection?.title ||
        prod?.vendor ||
        (item.variant as any)?.product?.seller?.name ||
        "SOPet"
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

  useEffect(() => {
    if (cart?.items?.length && selectedItems.length === 0) {
      setSelectedItems(cart.items.map((i) => i.id))
    }
  }, [cart?.items?.length])

  // Ensure selectedItems only contains IDs that still exist in the cart
  useEffect(() => {
    if (!sortedItems.length) return

    const currentIds = new Set(sortedItems.map((i) => i.id))
    setSelectedItems((prev) => prev.filter((id) => currentIds.has(id)))
  }, [sortedItems])

  // Calculate selected total
  const selectedTotal =
    sortedItems
      .filter((item) => selectedItems.includes(item.id))
      .reduce((acc, item) => {
        const itemTotal = item.total ?? item.unit_price * item.quantity
        return acc + itemTotal
      }, 0) || 0

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
            {Object.entries(itemsBySeller).map(([sellerName, items]) => {
              const isSellerSelected = items.every((i) =>
                selectedItems.includes(i.id)
              )
              return (
                <div
                  key={sellerName}
                  className="bg-white overflow-hidden shadow-sm"
                >
                  <div className="px-4 md:px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
                    <Checkbox
                      checked={isSellerSelected}
                      size="lg"
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
                        <DiscountIcon size={26} color="#9C6ADE" />
                      </div>
                      <p className="sop-body-lg-regular text-sop-primary-500">
                        ส่วนลดร้านค้า
                      </p>
                    </div>
                    {/* Store coupons button */}
                    <button
                      className="text-sop-neutral-gray-300 ml-auto md:ml-2 text-xs md:text-sm font-medium hover:underline"
                      onClick={() => setDiscountModalVendor(sellerName)}
                    >
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

      <DiscountModal
        isOpen={!!discountModalVendor}
        close={() => setDiscountModalVendor(null)}
        cart={cart as any}
        vendorName={discountModalVendor || undefined}
        showAppliedPromotions={true}
      />
    </div>
  )
}

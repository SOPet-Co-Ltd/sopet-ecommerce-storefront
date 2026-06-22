"use client"

import { Checkbox } from "@/components/atoms"
import { CartItem } from "@/components/molecules"
import { CartSummary } from "../CartSummary/CartSummary"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { DiscountIcon } from "@/icons"
import { Cart } from "@/types/cart"
import { DiscountModal } from "@/components/molecules/DiscountModal/DiscountModal"
import { getCartItemSellerGroup } from "@/lib/helpers/cart-seller"
import type { Seller } from "@/types/seller"
import { useCartPageUiStore } from "@/lib/zustand/cart-page-ui-store"

type CartTemplateProps = {
  cart: HttpTypes.StoreCart | Cart
  locale: string
  isCartUpdating?: boolean
  onItemQuantityChange?: (
    itemId: string,
    quantity: number
  ) => void | Promise<void>
  onItemDelete?: (itemId: string) => void | Promise<void>
  onItemVariantChange?: (
    itemId: string,
    variantId: string,
    quantity: number,
    unitPriceSnapshot?: number | null
  ) => void | Promise<void>
}

export const CartTemplate = ({
  cart,
  locale,
  isCartUpdating = false,
  onItemQuantityChange,
  onItemDelete,
  onItemVariantChange,
}: CartTemplateProps) => {
  const router = useRouter()
  const hasAppliedDefaultSelectionRef = useRef(false)
  const lastKnownItemIdsRef = useRef<string[]>([])
  const selectedItems = useCartPageUiStore((state) => state.selectedItemIds)
  const discountModalVendor = useCartPageUiStore(
    (state) => state.discountModalVendor
  )
  const stagedPromotionCodes = useCartPageUiStore(
    (state) => state.stagedPromotionCodes
  )
  const resetCartPageUi = useCartPageUiStore((state) => state.reset)
  const setSelectedItemIds = useCartPageUiStore(
    (state) => state.setSelectedItemIds
  )
  const toggleItemSelection = useCartPageUiStore(
    (state) => state.toggleItemSelection
  )
  const toggleManySelection = useCartPageUiStore(
    (state) => state.toggleManySelection
  )
  const openDiscountModal = useCartPageUiStore(
    (state) => state.openDiscountModal
  )
  const closeDiscountModal = useCartPageUiStore(
    (state) => state.closeDiscountModal
  )

  useEffect(() => {
    return () => {
      hasAppliedDefaultSelectionRef.current = false
      lastKnownItemIdsRef.current = []
      resetCartPageUi()
    }
  }, [resetCartPageUi])

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
      resetCartPageUi()
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
        if (selectedItems.includes(removedId)) {
          setSelectedItemIds(
            selectedItems.map((id) => (id === removedId ? addedId : id))
          )
        }

        return nextOrder
      }

      // For other changes (e.g. new items added/removed), fall back to current backend order
      return newIds
    })
  }, [cart?.items, resetCartPageUi, selectedItems, setSelectedItemIds])

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

  // Group items by seller key to avoid merging unrelated sellers that only
  // share the same display name or a UI fallback label.
  const itemsBySeller = sortedItems.reduce(
    (
      acc: Record<
        string,
        {
          seller: Seller
          items: HttpTypes.StoreCartLineItem[]
        }
      >,
      item
    ) => {
      const { key, seller } = getCartItemSellerGroup(item)

      if (!acc[key]) {
        acc[key] = {
          seller,
          items: [],
        }
      }

      acc[key].items.push(item)
      return acc
    },
    {}
  )

  const allItemIds = sortedItems.map((i) => i.id)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(allItemIds)
    } else {
      setSelectedItemIds([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    toggleItemSelection(id, checked)
  }

  const handleSelectSeller = (sellerKey: string, checked: boolean) => {
    const sellerItems = itemsBySeller[sellerKey]?.items.map((i) => i.id) || []
    toggleManySelection(sellerItems, checked)
  }

  useEffect(() => {
    if (!allItemIds.length) {
      hasAppliedDefaultSelectionRef.current = false
      lastKnownItemIdsRef.current = []
      resetCartPageUi()
      return
    }

    if (!hasAppliedDefaultSelectionRef.current) {
      hasAppliedDefaultSelectionRef.current = true
      setSelectedItemIds(allItemIds)
      lastKnownItemIdsRef.current = allItemIds
      return
    }

    const previousIds = new Set(lastKnownItemIdsRef.current)
    const newlyAddedIds = allItemIds.filter((id) => !previousIds.has(id))
    const hadAllPreviousSelected =
      previousIds.size > 0 &&
      [...previousIds].every((id) => selectedItems.includes(id))

    if (newlyAddedIds.length > 0 && hadAllPreviousSelected) {
      setSelectedItemIds([...selectedItems, ...newlyAddedIds])
    }

    lastKnownItemIdsRef.current = allItemIds
  }, [allItemIds, selectedItems, resetCartPageUi, setSelectedItemIds])

  // Ensure selectedItems only contains IDs that still exist in the cart
  useEffect(() => {
    if (!sortedItems.length) return

    const currentIds = new Set(sortedItems.map((i) => i.id))
    const nextSelectedItems = selectedItems.filter((id) => currentIds.has(id))

    if (nextSelectedItems.length !== selectedItems.length) {
      setSelectedItemIds(nextSelectedItems)
    }
  }, [selectedItems, setSelectedItemIds, sortedItems])

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

        {Object.keys(itemsBySeller).length > 1 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-4">
            คุณมีสินค้าจากหลายร้าน หน้าชำระเงินจะแบ่งยอดชำระต่อร้าน
            และชำระด้วยบัตรได้ในครั้งเดียว (PromptPay ใช้ได้เมื่อมีร้านเดียว)
          </p>
        )}

        <div className="flex gap-6">
          <div className=" flex flex-col gap-4 w-full">
            {Object.entries(itemsBySeller).map(([sellerKey, group]) => {
              const { seller, items } = group
              const isSellerSelected = items.every((i) =>
                selectedItems.includes(i.id)
              )
              return (
                <div
                  key={sellerKey}
                  className="bg-white overflow-hidden shadow-sm"
                >
                  <div className="px-4 md:px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
                    <Checkbox
                      checked={isSellerSelected}
                      size="lg"
                      onChange={(e) =>
                        handleSelectSeller(sellerKey, e.target.checked)
                      }
                    />
                    <span className="text-body-lg font-bold text-gray-900">
                      {seller.name}
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
                        onQuantityChange={onItemQuantityChange}
                        onDelete={onItemDelete}
                        onVariantChange={onItemVariantChange}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full z-10 pointer-events-none">
          <div className="container mx-auto px-4 md:px-6">
            <div className="pointer-events-auto">
              <CartSummary
                cart={cart}
                locale={locale}
                isCartUpdating={isCartUpdating}
                selectedCount={selectedItems.length}
                totalCount={cart?.items?.length || 0}
                isAllSelected={
                  selectedItems.length === allItemIds.length &&
                  allItemIds.length > 0
                }
                onSelectAll={handleSelectAll}
                customTotal={selectedTotal}
                selectedItemIds={selectedItems}
                isAnonymousCart={cart?.id === "anonymous-local-cart"}
                promotionCodes={stagedPromotionCodes}
              />
            </div>
          </div>
        </div>
      </div>

      <DiscountModal
        isOpen={!!discountModalVendor}
        close={closeDiscountModal}
        cart={cart as any}
        vendorName={discountModalVendor || undefined}
        showAppliedPromotions={true}
      />
    </div>
  )
}

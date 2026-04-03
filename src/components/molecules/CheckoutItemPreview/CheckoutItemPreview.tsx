"use client"

import {
  Cart,
  ExtendedLineItem,
  StoreCardShippingMethod,
  GroupedItems,
} from "@/types/cart"
import { Truck } from "lucide-react"
import { Text } from "@medusajs/ui"
import Image from "next/image"
import { convertToLocale } from "@/lib/helpers/money"

import { ShippingOptionDialog } from "@/components/organisms/ShippingOptionDialog/ShippingOptionDialog"
import { useEffect, useMemo, useState } from "react"
import { DeliveryTruckIcon, DiscountIcon } from "@/icons"
import { setMultiShippingMethods } from "@/lib/data/cart"
import { useRouter } from "next/navigation"

type CheckoutItemPreviewProps = {
  cart: Cart | null
  availableShippingMethods?: StoreCardShippingMethod[] | null
}

const CheckoutItemPreview = ({
  cart,
  availableShippingMethods,
}: CheckoutItemPreviewProps) => {
  const getNumericAmount = (value: unknown): number => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }
    if (value && typeof value === "object") {
      const numericValue = (value as { numeric_?: unknown }).numeric_
      if (typeof numericValue === "number") return numericValue
      if (typeof numericValue === "string") {
        const parsed = Number(numericValue)
        return Number.isFinite(parsed) ? parsed : 0
      }
      const amountValue = (value as { amount?: unknown }).amount
      if (typeof amountValue === "number") return amountValue
      if (typeof amountValue === "string") {
        const parsed = Number(amountValue)
        return Number.isFinite(parsed) ? parsed : 0
      }
    }
    return 0
  }

  // Per-seller shipping selections: { sellerId: shippingOptionId }
  const [sellerShippingSelections, setSellerShippingSelections] = useState<
    Record<string, string>
  >({})
  // Which seller is currently editing shipping
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null)
  const [isShippingOpen, setIsShippingOpen] = useState(false)

  const shippingMethods = cart?.shipping_methods || []
  const shippingOptionsById = useMemo(
    () =>
      new Map(
        (availableShippingMethods || []).map((option) => [option.id, option])
      ),
    [availableShippingMethods]
  )

  // Initialize per-seller selections from cart.shipping_methods
  useEffect(() => {
    if (!cart || !availableShippingMethods?.length) return

    const initial: Record<string, string> = {}
    const sellerIdsInCart = new Set<string>()

    for (const sm of shippingMethods) {
      const opt = availableShippingMethods.find(
        (o) => o.id === sm.shipping_option_id
      )
      if (opt?.seller_id && sm.shipping_option_id) {
        initial[opt.seller_id] = sm.shipping_option_id
        sellerIdsInCart.add(opt.seller_id)
      }
    }

    // For sellers without a selection yet, try the first available option
    const groupedItems = groupItemsBySeller(cart)
    let needsUpdate = false
    const newSelections = { ...initial }

    for (const sellerId of Object.keys(groupedItems)) {
      if (!initial[sellerId]) {
        const firstOption = availableShippingMethods.find(
          (o) => o.seller_id === sellerId
        )
        if (firstOption) {
          newSelections[sellerId] = firstOption.id
          needsUpdate = true
        }
      }
    }

    if (needsUpdate) {
      setSellerShippingSelections(newSelections)
      // Auto-persist to backend if we added defaults
      const allOptionIds = Object.values(newSelections).filter(Boolean)
      setMultiShippingMethods({
        cartId: cart.id,
        optionIds: allOptionIds,
      })
        .then(() => {
          router.refresh()
        })
        .catch((err) => {
          console.error("Failed to auto-select shipping methods", err)
        })
      return
    }

    setSellerShippingSelections(initial)
  }, [cart, availableShippingMethods, shippingMethods])

  if (!cart) return null

  const router = useRouter()

  const handleOpenShippingDialog = (sellerId: string) => {
    setEditingSellerId(sellerId)
    setIsShippingOpen(true)
  }

  const handleSelectShipping = async (methodId: string) => {
    if (!editingSellerId) return

    const updated = { ...sellerShippingSelections, [editingSellerId]: methodId }
    setSellerShippingSelections(updated)

    // Send all selections to backend
    const allOptionIds = Object.values(updated).filter(Boolean)
    if (allOptionIds.length > 0) {
      try {
        await setMultiShippingMethods({
          cartId: cart.id,
          optionIds: allOptionIds,
        })
        router.refresh()
      } catch (e: any) {
        console.error("Failed to set shipping methods:", e)
      }
    }
  }

  // Get shipping options for the currently editing seller
  const shippingOptionsForEditingSeller = useMemo(() => {
    if (!editingSellerId || !availableShippingMethods) return []
    return availableShippingMethods.filter(
      (opt) => opt.seller_id === editingSellerId
    )
  }, [editingSellerId, availableShippingMethods])

  const groupedItems: GroupedItems = groupItemsBySeller(cart)

  return (
    <div className="flex flex-col gap-6">
      {Object.keys(groupedItems).map((key) => {
        const seller = groupedItems[key].seller
        const items = groupedItems[key].items

        const subtotal = items.reduce((acc: number, item) => {
          return acc + item.unit_price * item.quantity
        }, 0)

        const sellerSelectedOptionId = sellerShippingSelections[key]
        const selectedShippingOption = sellerSelectedOptionId
          ? shippingOptionsById.get(sellerSelectedOptionId)
          : undefined
        const selectedCartShippingMethod =
          shippingMethods.find(
            (method) => method.shipping_option_id === sellerSelectedOptionId
          ) ||
          shippingMethods.find((method) => {
            const option = method.shipping_option_id
              ? shippingOptionsById.get(method.shipping_option_id)
              : undefined
            return option?.seller_id === key
          })

        const shippingTotal = getNumericAmount(
          selectedCartShippingMethod?.amount ?? selectedShippingOption?.amount
        )

        // Keep total aligned with displayed line-items; discount row is mock UI.
        const sellerTotal = subtotal + shippingTotal

        return (
          <div key={key} className="bg-white p-4">
            {/* Header */}
            <div className="border-b border-sop-neutral-gray-light mb-6">
              <div className="hidden md:grid grid-cols-[80px_1fr_200px_100px_100px] gap-4 items-center mb-2  text-sop-neutral-gray-400 text-sm">
                <div className="col-span-3 sop-body-lg-medium text-sop-base-black">
                  {seller.name}
                </div>
                <div className="sop-body-lg-medium text-sop-neutral-gray-400 text-right">
                  จำนวน
                </div>
                <div className="sop-body-lg-medium text-sop-neutral-gray-400 text-right">
                  ราคา
                </div>
              </div>
              <div className="md:hidden sop-body-lg-medium text-sop-base-black">
                {seller.name}
              </div>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-6 border-b border-sop-neutral-gray-light pb-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-row md:grid md:grid-cols-[80px_1fr_200px_100px_100px] gap-4 items-start"
                >
                  <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden shrink-0">
                    <Image
                      src={item.thumbnail || "/placeholder-image.png"}
                      alt={item.title || "Product"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <Text className="sop-body-md-medium line-clamp-2">
                      {item.title}
                    </Text>
                    <Text className="md:hidden text-sop-neutral-gray-400 sop-body-md-regular">
                      ตัวเลือกสินค้า : {item.variant?.title || "ปกติ"}
                    </Text>
                    {/* Mobile Price Row */}
                    <div className="flex md:hidden items-center justify-between mt-1 w-full">
                      <div className="flex items-center gap-2">
                        <Text className="font-normal text-base ">
                          {convertToLocale({
                            amount: item.unit_price * item.quantity,
                            currency_code: cart.currency_code,
                          })}
                        </Text>
                        {/* Mock Original Price */}
                        <Text className="text-sop-neutral-gray-medium text-sm line-through decoration-sop-neutral-gray-400">
                          {convertToLocale({
                            amount: item.unit_price * item.quantity * 1.15,
                            currency_code: cart.currency_code,
                          })}
                        </Text>
                      </div>
                      <div className="text-sop-neutral-grayfixed-400 text-sm">
                        {item.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Variant Column */}
                  <div className="hidden md:block text-sop-neutral-gray-400 text-sm pt-1">
                    ตัวเลือกสินค้า : {item.variant?.title || "ปกติ"}
                  </div>

                  {/* Desktop Qty and Price (Merged) */}
                  {/* Desktop Qty and Price (Separated & Left Aligned) */}
                  <div className="hidden md:block text-right text-sop-neutral-grayfixed-300 pt-1">
                    {item.quantity}
                  </div>
                  <div className="hidden md:block text-right pt-1 font-normal">
                    {convertToLocale({
                      amount: item.unit_price * item.quantity,
                      currency_code: cart.currency_code,
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Section */}
            <div className="py-4 border-b border-sop-neutral-gray-light text-sop-additionalblue-400 flex flex-row items-center gap-2  sop-body-lg-regular">
              <DiscountIcon className="w-sop-20px h-sop-20px md:w-sop-28px md:h-sop-28px text-sop-additionalblue-400" />
              <span className="sop-body-sm-regular md:sop-body-lg-regular text-sop-additionalblue-400">
                {/* TODO - Replace with real cart logic later */}
                {convertToLocale({
                  amount: 100,
                  currency_code: cart.currency_code,
                })}
              </span>
            </div>

            {/* Shipping Section */}
            <div className="py-4 border-b border-sop-neutral-gray-light ">
              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sop-additionalblue-400 font-normal">
                    <DeliveryTruckIcon className="w-[22px] h-[22px] md:w-[30px] md:h-[30px]" />
                    <span>ตัวเลือกการจัดส่ง</span>
                  </div>
                  <button
                    onClick={() => handleOpenShippingDialog(key)}
                    className="sop-link-xs-regular md:sop-link-md-regular text-sop-neutral-gray-300"
                  >
                    เปลี่ยน
                  </button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sop-additionalblue-400 font-normal">
                  <DeliveryTruckIcon size={24} />
                  <span>ตัวเลือกการจัดส่ง</span>
                </div>

                {selectedShippingOption ? (
                  <div className="flex flex-1 justify-end text-sop-neutral-gray-300 sop-body-xs-regular md:sop-body-md-regular">
                    {selectedShippingOption.name}
                  </div>
                ) : selectedCartShippingMethod?.name ? (
                  <div className="flex flex-1 justify-end text-sop-neutral-gray-300 sop-body-xs-regular md:sop-body-md-regular">
                    {selectedCartShippingMethod.name}
                  </div>
                ) : (
                  <div className="flex flex-1 justify-end text-sop-neutral-gray-300 sop-body-xs-regular md:sop-body-md-regular">
                    ส่งธรรมดาในประเทศ
                  </div>
                )}

                <div className="flex items-center justify-end gap-4 min-w-[150px]">
                  <span className="font-normal">
                    {shippingTotal > 0
                      ? convertToLocale({
                          amount: shippingTotal,
                          currency_code: cart.currency_code,
                        })
                      : "-"}
                  </span>
                  <button
                    onClick={() => handleOpenShippingDialog(key)}
                    className="text-gray-500 underline text-sm hover:text-gray-700"
                  >
                    เปลี่ยน
                  </button>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-4 flex justify-between items-center">
              <span className="sop-body-sm-regular md:sop-body-lg-regular text-sop-neutral-gray-300">
                รวมทั้งสิ้น
              </span>
              <span className="sop-body-xs-regular md:sop-body-md-regular text-sop-secondary-500">
                {convertToLocale({
                  amount: sellerTotal,
                  currency_code: cart.currency_code,
                })}
              </span>
            </div>
          </div>
        )
      })}

      {editingSellerId && shippingOptionsForEditingSeller.length > 0 && (
        <ShippingOptionDialog
          isOpen={isShippingOpen}
          onClose={() => {
            setIsShippingOpen(false)
            setEditingSellerId(null)
          }}
          shippingMethods={shippingOptionsForEditingSeller}
          cart={cart}
          onSelectMethod={handleSelectShipping}
          initialSelectedId={sellerShippingSelections[editingSellerId]}
        />
      )}
    </div>
  )
}

function groupItemsBySeller(cart: Cart): GroupedItems {
  const groupedBySeller: GroupedItems = {}

  cart.items?.forEach((item) => {
    const extendedItem = item as ExtendedLineItem
    const seller = extendedItem.product?.seller
    if (seller?.id) {
      if (!groupedBySeller[seller.id]) {
        groupedBySeller[seller.id] = {
          seller: seller,
          items: [],
        }
      }
      groupedBySeller[seller.id].items.push(extendedItem)
    } else {
      if (!groupedBySeller["fleek"]) {
        groupedBySeller["fleek"] = {
          seller: {
            name: "Fleek",
            id: "fleek",
            photo: "/Logo.svg",
            created_at: new Date().toISOString(),
            handle: "fleek",
            description: "Fleek Store",
            tax_id: "0000000000000",
          },
          items: [],
        }
      }
      groupedBySeller["fleek"].items.push(extendedItem)
    }
  })

  return groupedBySeller
}

export default CheckoutItemPreview

"use client"

import {
  Cart,
  ExtendedLineItem,
  StoreCardShippingMethod,
  GroupedItems,
} from "@/types/cart"
import { Percent, Truck } from "lucide-react"
import { Text } from "@medusajs/ui"
import Image from "next/image"
import { convertToLocale } from "@/lib/helpers/money"

import { ShippingOptionDialog } from "@/components/organisms/ShippingOptionDialog/ShippingOptionDialog"
import { useEffect, useMemo, useState } from "react"

type CheckoutItemPreviewProps = {
  cart: Cart | null
  availableShippingMethods?: StoreCardShippingMethod[] | null
}

const CheckoutItemPreview = ({
  cart,
  availableShippingMethods,
}: CheckoutItemPreviewProps) => {
  const [isShippingOpen, setIsShippingOpen] = useState(false)
  const [selectedShippingOptionId, setSelectedShippingOptionId] = useState("")

  if (!cart) return null

  const handleSelectShipping = async (methodId: string) => {
    setSelectedShippingOptionId(methodId)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        `checkout:selected_shipping_option:${cart.id}`,
        methodId
      )
      window.dispatchEvent(
        new CustomEvent("checkout:shipping-option-selected", {
          detail: { cartId: cart.id, optionId: methodId },
        })
      )
    }
  }

  const groupedItems: GroupedItems = groupItemsBySeller(cart)
  const shippingMethods = cart.shipping_methods || []
  const storageKey = `checkout:selected_shipping_option:${cart.id}`
  const shippingOptionsById = new Map(
    (availableShippingMethods || []).map((option) => [option.id, option])
  )
  const defaultShippingOption = availableShippingMethods?.[0]
  const selectedShippingOption = useMemo(() => {
    if (selectedShippingOptionId) {
      return shippingOptionsById.get(selectedShippingOptionId)
    }

    const selectedFromCart = shippingMethods[0]?.shipping_option_id
    if (selectedFromCart) {
      return shippingOptionsById.get(selectedFromCart)
    }

    return defaultShippingOption
  }, [
    defaultShippingOption,
    selectedShippingOptionId,
    shippingMethods,
    shippingOptionsById,
  ])

  useEffect(() => {
    let selectedFromStorage = ""
    if (typeof window !== "undefined") {
      selectedFromStorage = window.localStorage.getItem(storageKey) || ""
    }

    const isValidStorageSelection =
      !!selectedFromStorage && shippingOptionsById.has(selectedFromStorage)
    const selectedFromCart = shippingMethods[0]?.shipping_option_id
    const nextId =
      (isValidStorageSelection ? selectedFromStorage : "") ||
      selectedFromCart ||
      defaultShippingOption?.id ||
      ""
    if (!nextId) return

    setSelectedShippingOptionId(nextId)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, nextId)
      window.dispatchEvent(
        new CustomEvent("checkout:shipping-option-selected", {
          detail: { cartId: cart.id, optionId: nextId },
        })
      )
    }
  }, [
    cart.id,
    defaultShippingOption?.id,
    shippingMethods,
    shippingOptionsById,
    storageKey,
  ])

  return (
    <div className="flex flex-col gap-6">
      {Object.keys(groupedItems).map((key) => {
        const seller = groupedItems[key].seller
        const items = groupedItems[key].items

        const subtotal = items.reduce((acc: number, item) => {
          return acc + item.unit_price * item.quantity
        }, 0)

        const shippingTotal =
          selectedShippingOption?.amount ?? cart.shipping_total ?? 0

        // Keep total aligned with displayed line-items; discount row is mock UI.
        const sellerTotal = subtotal + shippingTotal

        return (
          <div key={key} className="bg-white rounded-lg  p-4 ">
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
              <Percent className="w-5 h-5 " />
              <span>ส่วนลด ฿100</span>
              {/* Replace with real cart logic later */}
            </div>

            {/* Shipping Section */}
            <div className="py-4 border-b border-sop-neutral-gray-light ">
              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-blue-600 font-normal">
                    <Truck className="w-5 h-5" />
                    <span>ตัวเลือกการจัดส่ง</span>
                  </div>
                  <button
                    onClick={() => setIsShippingOpen(true)}
                    className="text-gray-500 underline text-sm hover:text-gray-700"
                  >
                    เปลี่ยน
                  </button>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-blue-600 font-normal">
                  <Truck className="w-5 h-5" />
                  <span>ตัวเลือกการจัดส่ง</span>
                </div>

                {selectedShippingOption ? (
                  <div className="flex flex-1 md:justify-center text-gray-700">
                    {selectedShippingOption.name}
                  </div>
                ) : (
                  <div className="flex flex-1 md:justify-center text-gray-700">
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
                    onClick={() => setIsShippingOpen(true)}
                    className="text-gray-500 underline text-sm hover:text-gray-700"
                  >
                    เปลี่ยน
                  </button>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="pt-4 flex justify-between items-center">
              <span className="font-normal text-gray-900">รวมทั้งสิ้น</span>
              <span className="font-normal text-lg text-red-500">
                {convertToLocale({
                  amount: sellerTotal,
                  currency_code: cart.currency_code,
                })}
              </span>
            </div>
          </div>
        )
      })}

      {availableShippingMethods && (
        <ShippingOptionDialog
          isOpen={isShippingOpen}
          onClose={() => setIsShippingOpen(false)}
          shippingMethods={availableShippingMethods}
          cart={cart}
          onSelectMethod={handleSelectShipping}
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

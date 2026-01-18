"use client"

import { Cart } from "@/types/cart"
import { ClipboardList, Percent, Truck } from "lucide-react"
import { Heading, Text, clx } from "@medusajs/ui"
import Image from "next/image"
import { convertToLocale } from "@/lib/helpers/money"
import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"

type CheckoutItemPreviewProps = {
  cart: Cart | null
}

type Seller = {
  id: string
  name: string
  photo?: string
  created_at?: Date | string
}

type ExtendedLineItem = HttpTypes.StoreCartLineItem & {
  product?: HttpTypes.StoreProduct & {
    seller?: Seller
  }
}

type GroupedItems = Record<
  string,
  {
    seller: Seller
    items: ExtendedLineItem[]
  }
>

const CheckoutItemPreview = ({ cart }: CheckoutItemPreviewProps) => {
  if (!cart) return null

  const groupedItems: GroupedItems = groupItemsBySeller(cart)

  return (
    <div className="flex flex-col gap-6">
      {Object.keys(groupedItems).map((key) => {
        const seller = groupedItems[key].seller
        const items = groupedItems[key].items

        const subtotal = items.reduce((acc: number, item) => {
          return acc + item.unit_price * item.quantity
        }, 0)

        const shippingMethods = cart.shipping_methods || []
        const shippingTotal = shippingMethods.reduce(
          (acc: number, m: any) => acc + (m.price || 0),
          0
        )
        const discountTotal = 100

        const sellerTotal = subtotal + shippingTotal - discountTotal * 100

        return (
          <div key={key} className="bg-white rounded-lg  p-4 ">
            {/* Header */}
            <div className="border-b border-sop-neutral-gray-light mb-6">
              <div className="hidden md:grid grid-cols-[1fr_100px_100px] gap-4 items-center mb-2  text-sop-neutral-gray-400 text-sm">
                <div className="text-black font-normal text-lg">
                  {seller.name}
                </div>
                <div className="text-center">จำนวน</div>
                <div className="text-right">ราคา</div>
              </div>
              <div className="md:hidden font-normal text-lg text-black mb-2">
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
                    <Text className="font-normal text-base line-clamp-2">
                      {item.title}
                    </Text>
                    <Text className="md:hidden text-sop-neutral-gray-400 text-sm">
                      ตัวเลือกสินค้า : {item.variant?.title || "ปกติ"}
                    </Text>
                    {/* Mobile Price Row */}
                    <div className="flex md:hidden items-center gap-2 mt-1">
                      <Text className="font-normal text-base">
                        {convertToLocale({
                          amount: item.unit_price * item.quantity,
                          currency_code: cart.currency_code,
                        })}
                      </Text>
                      {/* Mock Original Price */}
                      <Text className="text-sop-neutral-gray-medium text-sm line-through decoration-sop-neutral-gray-300">
                        {convertToLocale({
                          amount: item.unit_price * item.quantity * 1.15,
                          currency_code: cart.currency_code,
                        })}
                      </Text>
                    </div>
                  </div>

                  {/* Desktop Variant Column */}
                  <div className="hidden md:block text-sop-neutral-gray-400 text-sm pt-1">
                    ตัวเลือกสินค้า : {item.variant?.title || "ปกติ"}
                  </div>

                  {/* Mobile Quantity */}
                  <div className="md:hidden text-sop-neutral-grayfixed-400 text-sm self-end ">
                    {item.quantity}
                  </div>

                  <div className="hidden md:block text-center text-sop-neutral-grayfixed-300 pt-1">
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
            <div className="py-4 border-b border-sop-neutral-gray-light flex flex-row items-center gap-2 text-purple-600 font-normal">
              <Percent className="w-5 h-5" />
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
                  <button className="text-gray-500 underline text-sm hover:text-gray-700">
                    เปลี่ยน
                  </button>
                </div>
                <div className="flex justify-between items-center pl-7">
                  <div className="text-gray-700 text-sm">
                    {shippingMethods.length > 0
                      ? shippingMethods
                          .map(
                            (m: any) =>
                              m.name +
                              (m.shipping_option?.name
                                ? ` (${m.shipping_option?.name})`
                                : "")
                          )
                          .join(", ")
                      : "ส่งธรรมดาในประเทศ"}
                  </div>
                  <span className="font-normal">
                    {shippingTotal > 0
                      ? convertToLocale({
                          amount: shippingTotal,
                          currency_code: cart.currency_code,
                        })
                      : "฿29.00"}
                  </span>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-blue-600 font-normal">
                  <Truck className="w-5 h-5" />
                  <span>ตัวเลือกการจัดส่ง</span>
                </div>

                {shippingMethods.length > 0 ? (
                  shippingMethods.map((method: any) => (
                    <div
                      key={method.id}
                      className="flex flex-1 md:justify-center text-gray-700"
                    >
                      {method.name} ({method.shipping_option?.name})
                    </div>
                  ))
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
                      : "฿29.00"}
                  </span>
                  <button className="text-gray-500 underline text-sm hover:text-gray-700">
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
                  amount: cart.total || sellerTotal,
                  currency_code: cart.currency_code,
                })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function groupItemsBySeller(cart: Cart): GroupedItems {
  const groupedBySeller: GroupedItems = {}

  cart.items?.forEach((item) => {
    const extendedItem = item as ExtendedLineItem
    const seller = extendedItem.product?.seller
    if (seller) {
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
            created_at: new Date(),
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

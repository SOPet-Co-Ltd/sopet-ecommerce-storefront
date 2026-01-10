"use client"

import { Button, Checkbox, Input } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  Heart,
  Trash,
  Minus,
  Plus,
  ChevronDown,
  Ticket,
  MoreVertical,
} from "lucide-react"
import { Modal } from "@/components/molecules/Modal/Modal"
import { deleteLineItem, updateLineItem } from "@/lib/data/cart"

// Using any for mock flexibility
type CartItemProps = {
  item: any
  currencyCode: string
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
}

export const CartItem = ({
  item,
  currencyCode,
  isSelected,
  onSelect,
}: CartItemProps) => {
  const { title, thumbnail, handle, images } = item.product || {}

  // Use thumbnail if available, otherwise fallback to the first image
  // Also encoding URI to handle spaces in filenames
  const displayImage =
    thumbnail || (images?.[0]?.url ? encodeURI(images[0].url) : null)

  const { options } = item.variant || {}
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    if (updating) return

    setUpdating(true)
    try {
      await updateLineItem({
        lineId: item.id,
        quantity: newQuantity,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteLineItem(item.id)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  return (
    <>
      <div className="flex flex-col py-sop-20 border-b border-sop-neutral-grayalpha-300 last:border-0 gap-4 md:gap-0 py-4 relative">
        <div
          className={`flex items-start w-full relative ${
            updating || deleting ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* ... (Checkbox & Image - unchanged) ... */}
          <div className="pt-1 md:pt-auto md:self-center mr-3 md:mr-4 shrink-0">
            <Checkbox
              checked={isSelected}
              onChange={(e) => onSelect(item.id, e.target.checked)}
            />
          </div>

          <div className="relative w-[100px] md:w-sop-100px aspect-square bg-sop-neutral-grayalpha-200 rounded-lg overflow-hidden shrink-0 border border-sop-neutral-grayalpha-200 mr-3 md:mr-4">
            {displayImage ? (
              <Image
                src={displayImage}
                alt={title || "Product image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100px, 120px"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
                <span>No Image</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center relative">
            <div className="absolute -top-1 -right-1 md:hidden z-10">
              <button
                className="p-1 text-gray-400 hover:text-gray-600"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {isMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-0"
                    onClick={() => setIsMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 flex items-center gap-2"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDeleteModalOpen(true)
                      }}
                    >
                      <Trash className="w-4 h-4" />
                      ลบสินค้า
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 space-y-4 pr-6 md:pr-0 pl-1">
              <div className="flex justify-between items-start gap-2">
                <Link
                  href={`/products/${handle}`}
                  className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 leading-tight"
                >
                  {item.product_title}
                </Link>
              </div>

              {options && (
                <div className="flex flex-wrap gap-2">
                  {options.map((opt: any) => (
                    <div key={opt.id} className="relative inline-block">
                      <select
                        className="appearance-none w-full bg-white border border-gray-200 rounded-md px-2 py-1.5 pr-6 text-xs text-gray-700 shadow-sm focus:outline-none focus:border-gray-300 transition-colors cursor-pointer"
                        defaultValue={opt.value}
                      >
                        <option value={opt.value}>
                          {opt.option_id === "color" ? opt.value : opt.value}
                        </option>
                        <option value="other">Other Option</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end justify-between mt-4 md:hidden pt-2">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    {convertToLocale({
                      amount: item.total,
                      currency_code: currencyCode,
                    })}
                  </span>
                  {item.original_total &&
                    item.original_total !== item.total && (
                      <span className="text-sop-3XS text-sop-neutral-gray-400 line-through leading-tight">
                        {convertToLocale({
                          amount: item.original_total,
                          currency_code: currencyCode,
                        })}
                      </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-6 h-6 flex items-center justify-center text-gray-900 border border-gray-200 rounded-[4px] hover:bg-gray-50 active:bg-gray-100 transition-colors bg-white disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium text-gray-900 w-4 text-center">
                    {updating ? "..." : item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center text-gray-900 border border-gray-200 rounded-[4px] hover:bg-gray-50 active:bg-gray-100 transition-colors bg-white"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end justify-center min-w-[120px] mx-8">
              <div className="flex flex-col items-end gap-1">
                {item.original_price && (
                  <span className="text-xs text-gray-400 line-through">
                    {convertToLocale({
                      amount: item.original_price,
                      currency_code: currencyCode,
                    })}
                  </span>
                )}
                <span className="text-body-lg font-medium text-gray-900">
                  {convertToLocale({
                    amount: item.unit_price,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-end gap-4 min-w-[140px]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-gray-900 border border-gray-200 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors bg-white shadow-xs disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-body-md font-normal text-gray-900 w-6 text-center">
                  {updating ? "..." : item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-900 border border-gray-200 rounded hover:bg-gray-50 active:bg-gray-100 transition-colors bg-white shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="ลบรายการ"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          heading="ยืนยันการลบ"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className="flex flex-col items-center gap-6 px-4 pb-4">
            <p className="text-body-lg text-gray-700 text-center">
              คุณต้องการลบสินค้านี้ออกจากตะกร้า
            </p>
            <div className="flex items-center gap-4 w-full">
              <Button
                variant="secondary"
                className="flex-1 rounded-full border border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50 h-10"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="flex-1 rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white h-10"
                loading={deleting}
                onClick={handleDelete}
              >
                ลบ
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

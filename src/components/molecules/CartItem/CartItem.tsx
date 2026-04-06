"use client"

import { Button, Checkbox, SmartImage } from "@/components/atoms"
import { convertToLocale } from "@/lib/helpers/money"
import Link from "next/link"
import { useState, useEffect } from "react"
import { TrashIcon, PlusLineIcon, MinusIcon, DownArrowIcon } from "@/icons"
import { MoreVertical, ChevronDownIcon } from "lucide-react"
import { HttpTypes } from "@medusajs/types"
import { Modal } from "@/components/molecules/Modal/Modal"
import {
  deleteCustomerCartItem,
  updateCustomerCartItem,
  changeCustomerCartItemVariant,
} from "@/lib/data/customer-cart"
import { VariantReselectionModal } from "./VariantReselectionModal"
import { listProducts } from "@/lib/data/products"
import { useParams } from "next/navigation"
import { toast } from "@/lib/helpers/toast"

// Using any for mock flexibility
type ExtendedCartItem = HttpTypes.StoreCartLineItem & {
  original_total?: number
  original_price?: number
  /** Max allowed quantity (e.g. variant inventory); when set, + is disabled at max */
  max_quantity?: number
}

type CartItemProps = {
  item: ExtendedCartItem
  currencyCode: string
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onQuantityChange?: (itemId: string, quantity: number) => void | Promise<void>
  onDelete?: (itemId: string) => void | Promise<void>
  onVariantChange?: (
    itemId: string,
    variantId: string,
    quantity: number,
    unitPriceSnapshot?: number | null
  ) => void | Promise<void>
}

export const CartItem = ({
  item,
  currencyCode,
  isSelected,
  onSelect,
  onQuantityChange,
  onDelete,
  onVariantChange,
}: CartItemProps) => {
  const displayImage = item.thumbnail
    ? decodeURIComponent(item.thumbnail)
    : "/images/placeholder.svg"

  // Safely extract variant options, handling cases where variant might not exist
  const options = item.variant?.options

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [updatingVariant, setUpdatingVariant] = useState(false)
  const [product, setProduct] = useState<
    (HttpTypes.StoreProduct & { seller?: any }) | null
  >(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const params = useParams()
  const locale = (params?.locale as string) || "th"

  const maxQuantity =
    (item as ExtendedCartItem).max_quantity ??
    (item.variant as { inventory_quantity?: number } | undefined)
      ?.inventory_quantity
  const isAtMax =
    typeof maxQuantity === "number" &&
    maxQuantity >= 0 &&
    Number(item.quantity) >= maxQuantity

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    if (updating) return
    if (
      typeof maxQuantity === "number" &&
      maxQuantity >= 0 &&
      newQuantity > maxQuantity
    ) {
      newQuantity = maxQuantity
    }

    setUpdating(true)
    try {
      if (onQuantityChange) {
        await onQuantityChange(item.id, newQuantity)
      } else {
        await updateCustomerCartItem({
          id: item.id,
          quantity: newQuantity,
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      if (onDelete) {
        await onDelete(item.id)
      } else {
        await deleteCustomerCartItem(item.id)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  // Fetch product data when modal opens
  useEffect(() => {
    if (isVariantModalOpen && item.product_handle && !product) {
      setLoadingProduct(true)
      listProducts({
        countryCode: locale,
        queryParams: {
          handle: [item.product_handle],
          limit: 1,
          fields:
            "id,title,handle,thumbnail,*images,*seller,*variants,*variants.calculated_price,+variants.inventory_quantity,*variants.options,*variants.options.option",
        },
        forceCache: false,
        includeStats: false,
      })
        .then(({ response }) => {
          setProduct(response.products[0] || null)
        })
        .catch((error) => {
          console.error("Error fetching product:", error)
          toast.error({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถโหลดข้อมูลสินค้าได้",
          })
        })
        .finally(() => {
          setLoadingProduct(false)
        })
    }
  }, [isVariantModalOpen, item.product_handle, locale, product])

  // Reset product when modal closes
  useEffect(() => {
    if (!isVariantModalOpen) {
      setProduct(null)
    }
  }, [isVariantModalOpen])

  const handleVariantUpdate = async (
    variantId: string,
    quantity: number,
    unitPriceSnapshot?: number | null
  ) => {
    if (updatingVariant) return
    if (variantId === item.variant_id && quantity === item.quantity) {
      setIsVariantModalOpen(false)
      return
    }

    setUpdatingVariant(true)
    try {
      if (onVariantChange) {
        await onVariantChange(item.id, variantId, quantity, unitPriceSnapshot)
      } else {
        await changeCustomerCartItemVariant({
          itemId: item.id,
          variantId,
          quantity,
        })
      }

      setIsVariantModalOpen(false)
      toast.success({
        title: "อัปเดตสำเร็จ",
        description: "อัปเดตสินค้าในตะกร้าเรียบร้อยแล้ว",
      })
    } catch (error: any) {
      console.error("Error updating variant:", error)
      toast.error({
        title: "เกิดข้อผิดพลาด",
        description:
          error?.message || "ไม่สามารถอัปเดตสินค้าได้ กรุณาลองใหม่อีกครั้ง",
      })
    } finally {
      setUpdatingVariant(false)
    }
  }

  // Format current variant options for display
  const getVariantDisplayText = () => {
    // Try variant options first
    if (options && options.length > 0) {
      return options
        .map((opt) => {
          const title = opt.option?.title || ""
          const value = opt.value || ""
          return title && value ? `${title}: ${value}` : value
        })
        .filter(Boolean)
        .join(", ")
    }

    // Fallback to variant_title if options are not available
    if (item.variant_title) {
      return item.variant_title
    }

    return ""
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
              size="lg"
              onChange={(e) => onSelect(item.id, e.target.checked)}
            />
          </div>

          <div className="relative w-20 h-20 bg-sop-neutral-grayalpha-200 overflow-hidden shrink-0 mr-3 md:mr-4">
            <SmartImage
              src={displayImage}
              alt={item.product_title || "Product image"}
              fill
              className="object-cover"
              sizes="80px"
            />
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
                      <TrashIcon size={16} />
                      ลบสินค้า
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex-1 space-y-4 pr-6 md:pr-0 pl-1">
              <div className="flex justify-between items-start gap-2">
                <Link
                  href={`/products/${item.product_handle || ""}`}
                  className="sop-body-xs-regular md:sop-body-sm-medium text-sop-neutral-gray-300"
                >
                  {item.product_title}
                </Link>
              </div>

              {/* Only show variant button if variant data exists (options or variant_title) */}
              {(options && options.length > 0) || item.variant_title ? (
                <Button
                  variant="neutral"
                  rounded="rounded"
                  size="sm"
                  onClick={() => setIsVariantModalOpen(true)}
                  disabled={updating || deleting}
                >
                  <div
                    className="flex items-center gap-1 w-full justify-between"
                    title={getVariantDisplayText()}
                  >
                    <span className="sop-body-xs-regular text-sop-neutral-gray-200">
                      {getVariantDisplayText()}
                    </span>
                    <DownArrowIcon size={14} />
                  </div>
                </Button>
              ) : null}

              <div className="flex items-end justify-between mt-4 md:hidden pt-2">
                <div className="flex flex-col">
                  <span className="sop-body-sm-medium text-gray-900 leading-tight">
                    {convertToLocale({
                      amount: item.total ?? 0,
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
                    disabled={Number(item.quantity) <= 1}
                    className="disabled:opacity-50 cursor-pointer"
                  >
                    <MinusIcon size={24} />
                  </button>
                  <span className="sop-body-sm-medium text-gray-900 w-4 text-center">
                    {updating ? "..." : item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.quantity + 1)}
                    disabled={isAtMax}
                    className="disabled:opacity-50 cursor-pointer"
                  >
                    <PlusLineIcon size={24} />
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
                  disabled={Number(item.quantity) <= 1}
                  className="disabled:opacity-50 cursor-pointer"
                >
                  <MinusIcon size={24} />
                </button>
                <span className="text-body-md font-normal text-gray-900 w-6 text-center">
                  {updating ? "..." : item.quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={isAtMax}
                  className="disabled:opacity-50 cursor-pointer"
                >
                  <PlusLineIcon size={24} />
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                title="ลบรายการ"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                <TrashIcon size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal width={400} onClose={() => setIsDeleteModalOpen(false)}>
          <div className="flex flex-col items-center gap-6 px-4 pb-4">
            <h2 className="sop-headline-lg-medium text-sop-neutral-gray-300">
              ยืนยันการลบ
            </h2>
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

      {/* Variant Reselection Modal */}
      {isVariantModalOpen && (
        <VariantReselectionModal
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          product={product}
          currentVariantId={item.variant_id || ""}
          onConfirm={handleVariantUpdate}
          currencyCode={currencyCode}
          isLoading={updatingVariant || loadingProduct}
        />
      )}
    </>
  )
}

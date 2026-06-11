"use client"

import { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { Button, SmartImage } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { ProductShowPrice } from "@/components/sections/ProductShowPrice/ProductShowPrice"
import { ProductVariants } from "@/components/molecules/ProductVariants/ProductVariants"
import { ProductDetailQuantitySelection } from "@/components/cells/ProductDetailQuantitySelection/ProductDetailQuantitySelection"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { SellerProps } from "@/types/seller"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value
      return acc
    },
    {}
  )
}

const normalizeOptionValue = (value: string | null | undefined) =>
  typeof value === "string" ? value.trim().toLowerCase() : ""

type VariantReselectionModalProps = {
  isOpen: boolean
  onClose: () => void
  product: (HttpTypes.StoreProduct & { seller?: SellerProps }) | null
  currentVariantId: string
  onConfirm: (
    variantId: string,
    quantity: number,
    unitPriceSnapshot?: number | null
  ) => Promise<void>
  currencyCode: string
  isLoading?: boolean
}

export const VariantReselectionModal = ({
  isOpen,
  onClose,
  product,
  currentVariantId,
  onConfirm,
  currencyCode,
  isLoading = false,
}: VariantReselectionModalProps) => {
  const [selectedVariant, setSelectedVariant] = useState<
    Record<string, string>
  >({})
  const [productQuantity, setProductQuantity] = useState(1)
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [previousVariantId, setPreviousVariantId] = useState<string>("")

  // Initialize selected variant from current variant when modal opens
  useEffect(() => {
    if (isOpen && product && currentVariantId) {
      const currentVariant = product.variants?.find(
        (v) => v.id === currentVariantId
      )
      if (currentVariant) {
        const variantMap = optionsAsKeymap(currentVariant.options ?? null) ?? {}
        setSelectedVariant(variantMap)
        setProductQuantity(1)
        setSelectedVariantId(currentVariantId)
        setPreviousVariantId(currentVariantId)
      }
    }
  }, [isOpen, product, currentVariantId])

  // Find variant ID based on selected options
  useEffect(() => {
    if (
      !product ||
      !product.variants ||
      Object.keys(selectedVariant).length === 0
    )
      return

    const variant = product.variants.find((candidate) =>
      candidate.options?.every((option) => {
        const optionKey = option.option?.title?.toLowerCase() || ""
        return (
          normalizeOptionValue(selectedVariant[optionKey]) ===
          normalizeOptionValue(option.value)
        )
      })
    )

    if (variant && variant.id !== selectedVariantId) {
      const newVariantId = variant.id
      setSelectedVariantId(newVariantId)
      // Reset quantity to 1 only when variant actually changes (not on initial load)
      if (previousVariantId && previousVariantId !== newVariantId) {
        setProductQuantity(1)
      }
      setPreviousVariantId(newVariantId)
    }
  }, [selectedVariant, product, selectedVariantId, previousVariantId])

  const handleVariantChange = (optionId: string, value: string) => {
    setSelectedVariant((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const handleConfirm = async () => {
    if (!selectedVariantId) return
    await onConfirm(
      selectedVariantId,
      productQuantity,
      variantPrice?.calculated_price_number ?? null
    )
  }

  const { variantPrice } = product
    ? getProductPrice({
        product,
        variantId: selectedVariantId,
      })
    : { variantPrice: null }

  const variantStock =
    product?.variants?.find(({ id }) => id === selectedVariantId)
      ?.inventory_quantity || 0

  const displayImage = product?.thumbnail
    ? decodeURIComponent(product.thumbnail)
    : "/images/placeholder.svg"

  if (!isOpen) return null

  // Show loading state while product is being fetched
  if (!product) {
    return (
      <Modal width={600} onClose={onClose}>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sop-primary-500"></div>
          <p className="text-sop-body-md-regular text-sop-neutral-gray-400">
            กำลังโหลดข้อมูลสินค้า...
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal width={600} onClose={onClose}>
      <div className="flex flex-col gap-6 p-sop-16px">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 bg-sop-neutral-grayalpha-200 overflow-hidden shrink-0 rounded-lg">
            <SmartImage
              src={displayImage}
              alt={product.title || "Product image"}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-1">
            <h2 className="sop-headline-md-medium text-sop-neutral-gray-300">
              {product.title}
            </h2>
          </div>
        </div>

        {/* Product Price */}
        <ProductShowPrice product={product} selectedVariant={selectedVariant} />

        {/* Product Variants */}
        <ProductVariants
          product={product}
          selectedVariant={selectedVariant}
          onVariantChange={handleVariantChange}
        />

        {/* Quantity Selection */}
        <ProductDetailQuantitySelection
          variantStock={variantStock}
          productQuantity={productQuantity}
          setProductQuantity={setProductQuantity}
        />

        {/* Footer Buttons */}
        <div className="flex items-center gap-4 pt-4 border-t border-sop-neutral-grayalpha-300">
          <Button
            variant="secondary"
            className="flex-1 rounded-full border border-sop-primary-500 text-sop-primary-500 hover:bg-sop-primary-50 h-10"
            onClick={onClose}
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            className="flex-1 rounded-full bg-sop-primary-500 hover:bg-sop-primary-600 text-white h-10"
            onClick={handleConfirm}
            loading={isLoading}
            disabled={!selectedVariantId || variantStock === 0 || isLoading}
          >
            ยืนยัน
          </Button>
        </div>
      </div>
    </Modal>
  )
}

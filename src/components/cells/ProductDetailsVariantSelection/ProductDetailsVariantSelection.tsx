"use client"

import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { useEffect, useState } from "react"
import React from "react"
import { addToCart } from "@/lib/data/cart"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"
import {
  FacebookShareButton,
  FacebookMessengerShareButton,
  LineShareButton,
} from "react-share"
import {
  ShareIcon,
  ChainIcon,
  FacebookCustomIcon,
  MessengerCustomIcon,
  LineCustomIcon,
  InstagramCustomIcon,
  MeatballsMenuIcon,
} from "@/icons"
import { ProductDetailQuantitySelection } from "@/components/cells"
import { AdditionalAttributeProps } from "@/types/product"

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

interface ShareButtonConfig {
  label: string
  icon: () => React.ReactNode
  handler?: () => void
  buttonClassName?: string
  ShareButtonComponent?: React.ComponentType<any>
  shareProps?: Record<string, any>
}

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string | null | undefined): string => {
  if (!html) return ""
  const tmp = document.createElement("DIV")
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ""
}

// Helper function to get short description from product
const getShortDescription = (
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
): string => {
  // First try to use subtitle if available
  if ((product as any).subtitle) {
    return (product as any).subtitle
  }

  // Otherwise, extract from description
  if (product.description) {
    const plainText = stripHtml(product.description)
    // Take first 150 characters and add ellipsis if longer
    return plainText.length > 150
      ? plainText.substring(0, 150).trim() + "..."
      : plainText.trim()
  }

  return ""
}

// Helper function to get product share content
const getProductShareContent = (
  product: HttpTypes.StoreProduct & { seller?: SellerProps },
  locale: string
): string => {
  const productName = product.title || ""
  const shortDescription = getShortDescription(product)
  const productLink =
    typeof window !== "undefined"
      ? window.location.href
      : `/${locale}/products/${product.handle}`

  return `${productName}\n${shortDescription}\n${productLink}`
}

const ShareModal = ({
  isOpen,
  onClose,
  product,
  locale,
}: {
  isOpen: boolean
  onClose: () => void
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  locale: string
}) => {
  // Get product share data
  const productLink =
    typeof window !== "undefined"
      ? window.location.href
      : `/${locale}/products/${product.handle}`

  // Handler to copy link to clipboard (with fallback for non-secure contexts)
  const handleCopyLink = async () => {
    const text = String(productLink ?? "")
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for HTTP or restricted contexts
        const textarea = document.createElement("textarea")
        textarea.value = text
        textarea.style.position = "fixed"
        textarea.style.left = "-9999px"
        textarea.setAttribute("readonly", "")
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
      }
      toast.success({
        title: "คัดลอกลิงก์สำเร็จ",
        description: "ลิงก์สินค้าถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
      })
      onClose()
    } catch (error) {
      toast.error({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถคัดลอกลิงก์ได้",
      })
    }
  }

  // Handler to open native share menu (mobile) or fallback to copy link (desktop)
  const handleNativeShare = async () => {
    const shareText = getProductShareContent(product, locale)
    const productName = product.title || ""

    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: shareText,
          url: productLink,
        })
        onClose()
      } catch (error: any) {
        // User cancelled or share failed
        if (error.name !== "AbortError") {
          toast.error({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถแชร์ได้",
          })
        }
      }
    } else {
      // Fallback for desktop: copy link to clipboard
      await handleCopyLink()
    }
  }

  // Share buttons configuration
  const hasFacebookAppId = !!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
  const shareButtons: ShareButtonConfig[] = [
    {
      label: "คัดลอกลิงก์",
      icon: () => {
        return <ChainIcon size={16} color="#4C4C4C" />
      },
      handler: handleCopyLink,
      buttonClassName:
        "md:w-sop-40px md:h-sop-40px w-sop-40px h-sop-40px rounded-full bg-[#D6D6D6] flex items-center justify-center hover:bg-[#C0C0C0] transition-colors cursor-pointer",
    },
    {
      label: "Line",
      icon: () => {
        return <LineCustomIcon size={40} />
      },
      ShareButtonComponent: LineShareButton,
      shareProps: {
        url: productLink,
        title: product.title || "",
        onShareWindowClose: onClose,
      },
      buttonClassName:
        "md:w-sop-40px md:h-sop-40px w-sop-40px h-sop-40px rounded-full bg-[#06C755] flex items-center justify-center hover:bg-[#05B04A] transition-colors cursor-pointer",
    },
    {
      label: "Facebook",
      icon: () => {
        return <FacebookCustomIcon size={40} />
      },
      ShareButtonComponent: FacebookShareButton,
      shareProps: {
        url: productLink,
        onShareWindowClose: onClose,
      },
      buttonClassName: "cursor-pointer",
    },
    {
      label: "Messenger",
      icon: () => <MessengerCustomIcon size={40} />,
      ShareButtonComponent: hasFacebookAppId
        ? FacebookMessengerShareButton
        : undefined,
      shareProps: hasFacebookAppId
        ? {
            url: productLink,
            appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
            onShareWindowClose: onClose,
          }
        : undefined,
      buttonClassName:
        "md:w-sop-40px md:h-sop-40px w-sop-40px h-sop-40px rounded-full bg-[#0084FF] flex items-center justify-center hover:bg-[#0073E6] transition-colors cursor-pointer",
    },
    {
      label: "Instagram",
      icon: () => {
        return <InstagramCustomIcon size={24} color="#FFFFFF" />
      },
      buttonClassName:
        "md:w-sop-40px md:h-sop-40px w-sop-40px h-sop-40px rounded-full bg-gradient-to-br from-[#FCAF45] via-[#FD1D1D] to-[#833AB4] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer",
    },
    {
      label: "แอปอื่นๆ",
      icon: () => {
        return <MeatballsMenuIcon size={20} color="#4C4C4C" />
      },
      handler: handleNativeShare,
      buttonClassName:
        "md:w-sop-40px md:h-sop-40px w-sop-40px h-sop-40px rounded-full border border-[#D6D6D6] bg-transparent flex items-center justify-center hover:bg-sop-neutral-grey-100 transition-colors cursor-pointer",
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-sop-base-white rounded-sop-16px p-6 max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 border-b border-[#D6D6D6] p-2">
          <h2 className="sop-body-lg-medium text-[#232323]">
            แชร์สินค้าให้เพื่อนของคุณ
          </h2>
        </div>
        {/* Share Options */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-[12px] justify-items-center">
          {shareButtons.map((button, index) => {
            const ShareButton = button.ShareButtonComponent
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                {ShareButton && button.shareProps ? (
                  <ShareButton
                    {...button.shareProps}
                    className={button.buttonClassName}
                  >
                    {button.icon()}
                  </ShareButton>
                ) : (
                  <button
                    type="button"
                    onClick={button.handler || undefined}
                    className={button.buttonClassName}
                  >
                    {button.icon()}
                  </button>
                )}
                <span className="sop-body-sm-light text-sop-base-black text-center">
                  {button.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { ProductShowPrice } from "@/components/sections/ProductShowPrice/ProductShowPrice"
import { ProductExpiryDate } from "@/components/sections/ProductExpiryDate/ProductExpiryDate"

export const ProductDetailsVariantSelection = ({
  product,
  locale,
  user,
  wishlist,
  dateOfExpired,
}: {
  product: HttpTypes.StoreProduct & {
    seller?: SellerProps
    attribute_values?: AdditionalAttributeProps[]
  }
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist[]
  dateOfExpired: string | null
}) => {
  // Sync the selected variant into the URL query string without triggering
  // a Next.js navigation, so sharing the URL preserves the selected variant
  const syncVariantToUrl = (nextSelectedVariant: Record<string, string>) => {
    if (typeof window === "undefined") {
      return
    }

    const url = new URL(window.location.href)
    const params = url.searchParams

    // Collect option keys based on the product options (e.g. color, size)
    const optionKeys =
      product.options
        ?.map((opt: any) => opt.title?.toLowerCase())
        .filter(Boolean) || []

    // Update only the variant-related params, keep other params intact
    optionKeys.forEach((key) => {
      params.delete(key as string)
      const value = nextSelectedVariant[key as string]
      if (value) {
        params.set(key as string, value)
      }
    })

    const newSearch = params.toString()
    const newUrl = newSearch ? `${url.pathname}?${newSearch}` : url.pathname

    window.history.replaceState(null, "", newUrl)
  }

  const [productQuantity, setProductQuantity] = useState(1)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const { onAddToCart, cart } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  // Check if product has any valid prices in current region
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  // Build default selected variant from the cheapest variant and current URL params
  const defaultSelectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  // Keep selected variant purely in client state so changing variants
  // doesn't trigger a Next.js navigation (and therefore no refetch).
  const [selectedVariant, setSelectedVariant] = useState(defaultSelectedVariant)

  // When URL search params change due to navigation (e.g. deep link),
  // sync them into local state.
  useEffect(() => {
    setSelectedVariant(defaultSelectedVariant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cheapestVariant?.id, JSON.stringify(allSearchParams)])

  // get selected variant id
  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every(
        (option: any) =>
          selectedVariant[option.option?.title.toLowerCase() || ""] ===
          option.value
      )
    )?.id || ""

  // Reset quantity when selected variant changes
  useEffect(() => {
    setProductQuantity(1)
  }, [variantId])

  // get variant price
  const { variantPrice } = getProductPrice({
    product,
    variantId,
  })

  const variantStock =
    product.variants?.find(({ id }) => id === variantId)?.inventory_quantity ||
    0

  const variantHasPrice = !!product.variants?.find(({ id }) => id === variantId)
    ?.calculated_price

  const isVariantStockMaxLimitReached =
    (cart?.items?.find((item) => item.variant_id === variantId)?.quantity ??
      0) >= variantStock

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!variantId || !hasAnyPrice) return null

    setIsAdding(true)

    const subtotal = +(variantPrice?.calculated_price_without_tax_number || 0)
    const total = +(variantPrice?.calculated_price_number || 0)

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: productQuantity,
      subtotal,
      total,
      tax_total: total - subtotal,
      variant_id: variantId,
      product_id: product.id,
      variant: product.variants?.find(({ id }) => id === variantId),
    }

    try {
      if (!isVariantStockMaxLimitReached) {
        onAddToCart(storeCartLineItem, variantPrice?.currency_code || "thb")
      }
      await addToCart({
        variantId: variantId,
        quantity: productQuantity,
        countryCode: locale,
        productId: product.id,
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "Some variant does not have the required inventory",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      {/* Product Price */}
      <ProductShowPrice product={product} selectedVariant={selectedVariant} />

      {/* Product Expiry Date */}
      <ProductExpiryDate dateOfExpired={dateOfExpired} />

      {/* Product Variants Selection */}
      {hasAnyPrice && (
        <ProductVariants
          product={product}
          selectedVariant={selectedVariant}
          onVariantChange={(optionId, value) =>
            setSelectedVariant((prev) => {
              const next = {
                ...prev,
                [optionId]: value,
              }
              syncVariantToUrl(next)
              return next
            })
          }
        />
      )}

      {/* Product Quantity Selection */}
      <ProductDetailQuantitySelection
        variantStock={variantStock}
        productQuantity={productQuantity}
        setProductQuantity={setProductQuantity}
      />

      <div className="flex justify-between items-center md:gap-6 gap-2">
        {/* Add to Cart */}
        <Button
          onClick={handleAddToCart}
          disabled={!variantStock || !variantHasPrice || !hasAnyPrice}
          loading={isAdding}
          fill
          size="lg"
          variant="secondary"
        >
          {!hasAnyPrice
            ? "NOT AVAILABLE IN YOUR REGION"
            : variantStock && variantHasPrice
              ? "เพิ่มใส่ตะกร้า"
              : "สินค้าหมด"}
        </Button>

        {/* Buy now action */}
        <Button
          // TODO: Handle Buy Now action
          onClick={() => {}}
          disabled={!variantStock || !variantHasPrice || !hasAnyPrice}
          fill
          size="lg"
          className="md:py-sop-12px py-sop-8px"
        >
          ซื้อสินค้า
        </Button>

        <button
          onClick={() => setIsShareModalOpen(true)}
          disabled={!variantStock || !variantHasPrice || !hasAnyPrice}
          className="cursor-pointer"
        >
          <ShareIcon size={24} color={"#9c6ade"} />
        </button>

        <WishlistButton
          productId={product.id}
          wishlist={wishlist}
          user={user}
        />

        {/* Seller message */}

        {/* {user && product.seller && (
        <Chat
          user={user}
          seller={product.seller}
          buttonClassNames="w-full uppercase"
          product={product}
        />
      )} */}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
        locale={locale}
      />
    </>
  )
}

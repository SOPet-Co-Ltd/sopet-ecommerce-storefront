"use client"

import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { useState } from "react"
import { addToCart } from "@/lib/data/cart"
import { Chat } from "@/components/organisms/Chat/Chat"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"
import {
  MinusSquareIcon,
  PlusSquareIcon,
  ShareIcon,
  WishListHeartIcon,
} from "@/icons"
import { ProductDetailQuantitySelection } from "@/components/cells"

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

export const ProductDetailsVariantSelection = ({
  product,
  locale,
  user,
  wishlist,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist[]
}) => {
  const [productQuantity, setProductQuantity] = useState(1)

  const { onAddToCart, cart } = useCartContext()
  const [isAdding, setIsAdding] = useState(false)
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  // Check if product has any valid prices in current region
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  // set default variant
  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  // get selected variant id
  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

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
      quantity: 1,
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
        quantity: 1,
        countryCode: locale,
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
      {/* Product Variants Selection */}
      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
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
          size="fill"
          variant="secondary"
          className="md:py-sop-12px py-sop-8px"
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
          size="fill"
          className="md:py-sop-12px py-sop-8px"
        >
          ซื้อสินค้า
        </Button>

        <Button
          // TODO: Handle Share action
          onClick={() => {}}
          disabled={!variantStock || !variantHasPrice || !hasAnyPrice}
          size="icon"
          variant="icon"
          className="md:py-sop-12px py-sop-8px"
        >
          <ShareIcon size={24} color={"#9c6ade"} />
        </Button>

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
    </>
  )
}

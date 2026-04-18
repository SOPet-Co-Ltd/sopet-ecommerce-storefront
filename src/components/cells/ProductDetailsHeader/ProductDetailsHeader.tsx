"use client"

import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { CartSource, useAddToCartMutation, useCartQuery } from "@/hooks/useCartQuery"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { toast } from "@/lib/helpers/toast"
import { buildStorefrontCartItemMetadata } from "@/lib/helpers/cart-seller"

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

export const ProductDetailsHeader = ({
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
  const cartSource: CartSource = user ? "customer" : "anonymous"
  const { data: cart } = useCartQuery({
    locale,
    source: cartSource,
  })
  const addToCartMutation = useAddToCartMutation(locale, cartSource)
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

    const subtotal = +(variantPrice?.calculated_price_without_tax_number || 0)
    const total = +(variantPrice?.calculated_price_number || 0)
    const variant = product.variants?.find(({ id }) => id === variantId)

    try {
      await addToCartMutation.mutateAsync({
        productId: product.id,
        variantId,
        quantity: 1,
        unitPriceSnapshot: variantPrice?.calculated_price_number ?? 0,
        source: "storefront_cart",
        metadata: buildStorefrontCartItemMetadata(product, variantId),
        currencyCode: variantPrice?.currency_code || "THB",
        maxQuantity: variantStock > 0 ? variantStock : undefined,
        optimisticItem: {
          thumbnail: product.thumbnail || "",
          product_title: product.title,
          quantity: 1,
          subtotal,
          total,
          tax_total: total - subtotal,
          variant_id: variantId,
          product_id: product.id,
          variant,
          product,
        },
      })

      toast.success({
        title: "เพิ่มลงตะกร้าแล้ว",
        description: `${product.title ?? "สินค้า"} · จำนวน 1 ชิ้น`,
      })
    } catch (error) {
      toast.error({
        title: "Error adding to cart",
        description: "Some variant does not have the required inventory",
      })
    }
  }

  return (
    <div className="border rounded-xs p-5">
      <div className="flex justify-between">
        <div>
          <h1 className="heading-lg text-primary">{product.title}</h1>
          <div className="mt-2 flex gap-2 items-center">
            {hasAnyPrice && variantPrice ? (
              <>
                <span className="heading-md text-primary">
                  {variantPrice.calculated_price}
                </span>
                {variantPrice.calculated_price_number !==
                  variantPrice.original_price_number && (
                  <span className="label-md text-secondary line-through">
                    {variantPrice.original_price}
                  </span>
                )}
              </>
            ) : (
              <span className="label-md text-secondary pt-2 pb-4">
                Not available in your region
              </span>
            )}
          </div>
        </div>
        <div>
          {/* Add to Wishlist */}
          <WishlistButton
            productId={product.id}
            wishlist={wishlist}
            user={user}
          />
        </div>
      </div>

      {/* Product Variants */}
      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}

      {/* Add to Cart */}
      <Button
        onClick={handleAddToCart}
        disabled={!variantStock || !variantHasPrice || !hasAnyPrice}
        loading={addToCartMutation.isPending}
        className="w-full uppercase mb-4 py-3 flex justify-center"
        size="default"
      >
        {!hasAnyPrice
          ? "NOT AVAILABLE IN YOUR REGION"
          : variantStock && variantHasPrice
            ? "ADD TO CART"
            : "OUT OF STOCK"}
      </Button>
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
  )
}

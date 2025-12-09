"use client"

import { HttpTypes } from "@medusajs/types"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
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

export const ProductCardShowPrice = ({
  product,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
}) => {
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice, expensivePrice } = getProductPrice({
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

  // Determine which price to display
  const displayPrice = variantPrice || cheapestPrice

  return (
    <div className="flex gap-2 items-center">
      {hasAnyPrice && displayPrice ? (
        <>
          <span className="text-sop-secondary-500 rounded-sop-8px md:sop-body-lg-medium sop-body-lg-medium">
            ฿{displayPrice.calculated_price_number}
          </span>
          {displayPrice.calculated_price_number !==
            displayPrice.original_price_number && (
            <span className="text-sop-neutral-grayalpha-400 md:sop-strike-sm-regular sop-strike-sm-regular">
              ฿{displayPrice.original_price_number}
            </span>
          )}
        </>
      ) : (
        <span className="label-md text-secondary pt-2 pb-4">
          Not available in your region
        </span>
      )}
    </div>
  )
}

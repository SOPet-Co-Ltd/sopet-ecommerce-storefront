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

export const ProductShowPrice = ({
  product,
  selectedVariant: externalSelectedVariant,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  selectedVariant?: Record<string, string>
}) => {
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice, expensivePrice } = getProductPrice({
    product,
  })

  // Check if product has any valid prices in current region
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  // set default variant - use external if provided, otherwise use search params
  const selectedVariant = externalSelectedVariant
    ? externalSelectedVariant
    : hasAnyPrice
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

  return (
    <div className="flex gap-2 items-center">
      {hasAnyPrice && variantPrice ? (
        <>
          <span className="md:sop-headline-md-medium sop-headline-sm-medium text-sop-base-white bg-sop-secondary-500 px-2 rounded-sop-8px">
            ฿{variantPrice.calculated_price_number}
          </span>
          {variantPrice.calculated_price_number !==
            variantPrice.original_price_number && (
            <span className="md:sop-strike-lg-regular sop-strike-md-regular text-sop-neutral-grayalpha-400">
              ฿{variantPrice.original_price_number}
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

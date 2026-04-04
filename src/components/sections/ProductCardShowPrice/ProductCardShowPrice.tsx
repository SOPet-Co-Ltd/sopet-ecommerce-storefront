"use client"

import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { SellerProps } from "@/types/seller"

export const ProductCardShowPrice = ({
  product,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
}) => {
  const { cheapestPrice, cheapestVariant } = getProductPrice({
    product,
  })

  // Cards are shown in grids alongside listing/search URL params (filters, query,
  // price range). Those must not participate in variant selection — only PDP
  // should combine URL with options. Always show the cheapest priced variant.
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const displayPrice = cheapestPrice

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

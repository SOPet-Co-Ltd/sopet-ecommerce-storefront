"use client"

import { HttpTypes } from "@medusajs/types"

import useUpdateSearchParams from "@/hooks/useUpdateSearchParams"
import { Hit } from "instantsearch.js"
import { cn } from "@/lib/utils"
import { Fragment } from "react"

export const ProductVariants = ({
  product,
  selectedVariant,
  onVariantChange,
}: {
  product: HttpTypes.StoreProduct
  selectedVariant: Record<string, string>
  onVariantChange?: (optionId: string, value: string) => void
}) => {
  const updateSearchParams = useUpdateSearchParams()

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    if (value) {
      if (onVariantChange) {
        onVariantChange(optionId, value)
      } else {
        updateSearchParams(optionId, value)
      }
    }
  }

  return (
    <div className="md:grid md:grid-cols-[8rem_1fr] flex flex-col gap-4">
      {(product.options || []).map(
        ({ id, title, values }: HttpTypes.StoreProductOption) => (
          <Fragment key={id}>
            <div>
              <p className="md:sop-body-lg-regular sop-body-md-regular text-sop-neutral-gray-400">
                {title}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(values || []).map(
                ({
                  id,
                  value,
                }: Partial<Hit<HttpTypes.StoreProductOptionValue>>) => (
                  <button
                    key={id}
                    onClick={() =>
                      setOptionValue(title.toLowerCase(), value || "")
                    }
                    className={cn(
                      "cursor-pointer sop-body-sm-regular border rounded-full px-2 py-1 text-sop-neutral-gray-200 bg-sop-neutral-gray-500 border-sop-neutral-grayalpha-100",
                      selectedVariant[title.toLowerCase()] === value &&
                        "text-sop-secondary-500 border-sop-secondary-500 bg-transparent"
                    )}
                  >
                    {value}
                  </button>
                )
              )}
            </div>
          </Fragment>
        )
      )}
    </div>
  )
}

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
        ({ id, title, values }: HttpTypes.StoreProductOption) => {
          const optionKey = title.toLowerCase()
          const fieldsetId = `variant-${id}`

          return (
            <Fragment key={id}>
              <div>
                <p
                  id={`${fieldsetId}-label`}
                  className="md:sop-body-lg-regular sop-body-md-regular text-sop-neutral-gray-400"
                >
                  {title}
                </p>
              </div>
              <fieldset
                className="flex gap-2 flex-wrap"
                aria-labelledby={`${fieldsetId}-label`}
              >
                <legend className="sr-only">เลือก{title}</legend>
                {(values || []).map(
                  ({
                    id: valueId,
                    value,
                  }: Partial<Hit<HttpTypes.StoreProductOptionValue>>) => {
                    const isSelected = selectedVariant[optionKey] === value
                    const inputId = `variant-${id}-${valueId}`

                    return (
                      <label
                        key={valueId}
                        htmlFor={inputId}
                        className={cn(
                          "cursor-pointer sop-body-sm-regular border rounded-full px-2 py-1 text-sop-neutral-gray-200 bg-sop-neutral-gray-500 border-sop-neutral-grayalpha-100 inline-flex items-center",
                          isSelected &&
                            "text-sop-secondary-500 border-sop-secondary-500 bg-transparent"
                        )}
                      >
                        <input
                          type="radio"
                          id={inputId}
                          name={`variant-option-${id}`}
                          value={value || ""}
                          checked={isSelected}
                          onChange={() =>
                            setOptionValue(optionKey, value || "")
                          }
                          className="sr-only"
                          aria-label={`${title}: ${value}`}
                        />
                        <span>{value}</span>
                      </label>
                    )
                  }
                )}
              </fieldset>
            </Fragment>
          )
        }
      )}
    </div>
  )
}

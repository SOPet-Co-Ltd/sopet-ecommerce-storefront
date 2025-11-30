"use client"

import { MinusSquareIcon, PlusSquareIcon } from "@/icons"
import { SetStateAction } from "react"

type ProductDetailQuantitySelectionProps = {
  variantStock: number
  productQuantity: number
  setProductQuantity: (value: SetStateAction<number>) => void
}

export const ProductDetailQuantitySelection = ({
  variantStock,
  productQuantity,
  setProductQuantity,
}: ProductDetailQuantitySelectionProps) => {
  return (
    <div className="grid md:grid-cols-[8rem_1fr] grid-cols-[6rem_1fr]">
      <div>
        <p className="md:sop-body-lg-regular sop-body-md-regular  text-sop-neutral-gray-400">
          จำนวน
        </p>
      </div>
      <div className="flex md:gap-20 items-center justify-between md:justify-normal">
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="cursor-pointer"
            disabled={productQuantity <= 1}
            onClick={() =>
              setProductQuantity((q) => {
                if (q > 1) return q - 1
                return 1
              })
            }
          >
            <div className="md:block hidden">
              <MinusSquareIcon
                size={32}
                color={productQuantity <= 1 ? "#22222947" : "#211f23"}
              />
            </div>
            <div className="block md:hidden">
              <MinusSquareIcon
                size={24}
                color={productQuantity <= 1 ? "#22222947" : "#211f23"}
              />
            </div>
          </button>
          <p className="md:sop-body-lg-regular sop-body-md-regular w-sop-28px flex justify-center text-center">
            {productQuantity}
          </p>

          <button
            type="button"
            className="cursor-pointer"
            disabled={productQuantity >= variantStock}
            onClick={() =>
              setProductQuantity((q) => {
                if (q < variantStock) return q + 1
                return q
              })
            }
          >
            <div className="md:block hidden">
              <PlusSquareIcon
                size={32}
                color={
                  productQuantity >= variantStock ? "#22222947" : "#211f23"
                }
              />
            </div>
            <div className="block md:hidden">
              <PlusSquareIcon
                size={24}
                color={
                  productQuantity >= variantStock ? "#22222947" : "#211f23"
                }
              />
            </div>
          </button>
        </div>
        <p className="sop-body-sm-regular text-sop-neutral-gray-400">
          เหลือสินค้า {variantStock} ชิ้น
        </p>
      </div>
    </div>
  )
}

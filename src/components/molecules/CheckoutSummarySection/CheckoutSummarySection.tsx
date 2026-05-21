"use client"

import { Button } from "@/components/atoms"
import { Infotag } from "@/components/atoms/InfoTag/Infotag"
import { PiggyBankIcon } from "@/icons"
import { LockKeyholeIcon } from "lucide-react"
import { useCheckoutSubmit } from "@/lib/checkout/use-checkout-submit"
import type { HttpTypes } from "@medusajs/types"
import { formatPrice, useCheckoutTotals } from "./use-checkout-totals"

type SummaryRowProps = {
  label: string
  value: string
  valueClassName?: string
}

const SummaryRow = ({
  label,
  value,
  valueClassName = "text-sop-base-black",
}: SummaryRowProps) => {
  return (
    <div className="flex justify-between">
      <label className="lg:sop-body-md-regular sop-body-sm-regular text-sop-neutral-gray-200">
        {label}
      </label>

      <label
        className={`lg:sop-body-md-medium sop-body-sm-medium ${valueClassName}`}
      >
        {value}
      </label>
    </div>
  )
}

type CheckoutSummarySectionProps = {
  customer: HttpTypes.StoreCustomer | null
}

const CheckoutSummarySection = ({ customer }: CheckoutSummarySectionProps) => {
  const { submit, isSubmitting } = useCheckoutSubmit()
  const {
    totalQuantity,
    subtotal,
    platformDiscount,
    vendorDiscount,
    shippingFee,
    totalSaving,
    finalPrice,
  } = useCheckoutTotals()

  return (
    <div className="mt-sop-12px w-full rounded-sop-24px bg-sop-base-white lg:px-sop-24px lg:py-sop-20px px-sop-16px py-sop-20px ">
      {!customer && (
        <Infotag
          className="sop-body-sm-medium mb-sop-16px flex w-full justify-center rounded-sop-12 bg-sop-additionalblue-100 px-sop-16px py-sop-12px text-sop-additionalblue-500"
          leftIcon={<LockKeyholeIcon size={32} className="pr-sop-8px" />}
        >
          บิลนี้ถูกสั่งซื้อผ่าน Guest Mode
        </Infotag>
      )}

      <label className="lg:sop-body-lg-medium sop-body-md-medium text-sop-primary-500">
        สรุปคำสั่งซื้อ
      </label>

      <div className="mb-4 mt-sop-16px space-y-sop-8px">
        <SummaryRow
          label={`ยอดรวมสินค้า (${totalQuantity} ชิ้น)`}
          value={formatPrice(subtotal)}
        />

        {vendorDiscount > 0 && (
          <SummaryRow
            label="ส่วนลดร้านค้า"
            value={`- ${formatPrice(vendorDiscount)}`}
            valueClassName="text-sop-secondary-600"
          />
        )}

        {platformDiscount > 0 && (
          <SummaryRow
            label="ส่วนลดแพลตฟอร์ม"
            value={`- ${formatPrice(platformDiscount)}`}
            valueClassName="text-sop-secondary-600"
          />
        )}

        <SummaryRow label="ค่าจัดส่ง" value={formatPrice(shippingFee)} />
      </div>

      <div className="hidden sm:block border-t pt-sop-16px text-sop-neutral-grayalpha-200">
        <div className="flex justify-between">
          <label className="sop-body-lg-medium text-sop-neutral-gray-300">
            ยอดชำระเงิน
          </label>

          <label className="sop-headline-md-medium text-sop-secondary-600">
            {formatPrice(finalPrice)}
          </label>
        </div>
      </div>

      {totalSaving > 0 && (
        <Infotag
          className="lg:sop-body-sm-medium sop-body-sm-regular lg:mt-sop-16px w-full rounded-sop-8px bg-sop-additionalgreen-200 px-sop-16px py-sop-8px text-sop-additionalgreen-700"
          leftIcon={
            <PiggyBankIcon size={24} className="pr-sop-8px" color="#4E7762" />
          }
        >
          คุณประหยัดไป {formatPrice(totalSaving)} จากออเดอร์นี้
        </Infotag>
      )}

      <Button
        className="mt-sop-16px hidden w-full sm:block"
        variant="primary"
        size="lg"
        type="button"
        loading={isSubmitting}
        disabled={isSubmitting}
        onClick={() => void submit()}
      >
        ชำระเงิน {formatPrice(finalPrice)}
      </Button>
    </div>
  )
}

export default CheckoutSummarySection

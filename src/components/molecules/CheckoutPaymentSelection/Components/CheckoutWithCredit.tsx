"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/atoms"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"

import {
  JCBIcon,
  MastercardIcon,
  UnionPayIcon,
  VisaIcon,
} from "@/icons/payment"
import { CustomerCard } from "../Types/PaymentType"

type Props = {
  payment?: CustomerCard[]
}

export const SelectWithCreditCard = ({ payment = [] }: Props) => {
  const [selectedCardId, setSelectedCardId] = useState("")

  useEffect(() => {
    if (payment.length === 0) return

    const defaultCard = payment.find((card) => card.is_default)

    setSelectedCardId(defaultCard?.id ?? payment[0]?.id ?? "")
  }, [payment])

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case "mastercard":
        return <MastercardIcon className="h-sop-32px w-sop-32px" />

      case "visa":
        return <VisaIcon className="h-sop-32px w-sop-32px" />

      case "jcb":
        return <JCBIcon className="h-sop-32px w-sop-32px" />

      case "unionpay":
        return <UnionPayIcon className="h-sop-32px w-sop-32px" />

      default:
        return null
    }
  }

  if (payment.length === 0) {
    return null
  }

  return (
    <div>
      <div className="my-sop-20px border-t border-sop-neutral-grayalpha-200" />

      <div className="flex items-center justify-between">
        <label className="sop-body-md-regular text-sop-neutral-gray-300">
          บัตรที่บันทึกไว้
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          rounded="full"
          iconLeft={<Plus className="h-sop-16px w-sop-16px" />}
        >
          เพิ่มบัตรใหม่
        </Button>
      </div>

      <div className="mt-sop-16px space-y-sop-12px">
        {payment.map((card) => (
          <SelectBox
            key={card.id}
            name="saved-card"
            value={card.id}
            selectedValue={selectedCardId}
            onChange={setSelectedCardId}
            rightIcon={getCardIcon(card.brand)}
            className="bg-sop-additionalblue-100"
          >
            <div className="flex w-full flex-col">
              <span className="text-sop-md-regular text-sop-neutral-gray-200">
                {card.brand} **** {card.last4}
              </span>

              <span className="text-sop-sm-regular text-sop-neutral-gray-300">
                หมดอายุ {String(card.exp_month).padStart(2, "0")}/
                {String(card.exp_year).slice(-2)}
              </span>
            </div>
          </SelectBox>
        ))}
      </div>
    </div>
  )
}

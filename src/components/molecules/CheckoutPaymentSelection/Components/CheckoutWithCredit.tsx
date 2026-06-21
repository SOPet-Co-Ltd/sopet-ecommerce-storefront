"use client"

import { useEffect, useState } from "react"

import { Button, Checkbox } from "@/components/atoms"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"

import {
  JCBIcon,
  MastercardIcon,
  UnionPayIcon,
  VisaIcon,
} from "@/icons/payment"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { CustomerCard } from "../Types/PaymentType"
import { PlusIcon } from "@/icons"
import { AddCardModal } from "./AddCardModal"

type Props = {
  payment?: CustomerCard[]
  error?: string | null
  onCardAdded?: (paymentMethod: CustomerPaymentMethod) => void
}

export const SelectWithCreditCard = ({
  payment = [],
  error,
  onCardAdded,
}: Props) => {
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const selectedCardId = useCheckoutStore((state) => state.selectedCardId)
  const setSelectedCardId = useCheckoutStore((state) => state.setSelectedCardId)
  const customer = useCheckoutStore((state) => state.customer)
  const saveShippingAddress = useCheckoutStore(
    (state) => state.saveShippingAddress
  )
  const setSaveShippingAddress = useCheckoutStore(
    (state) => state.setSaveShippingAddress
  )

  const handleAddCardSuccess = (paymentMethod: CustomerPaymentMethod) => {
    setShowAddCardModal(false)
    onCardAdded?.(paymentMethod)
    setSelectedCardId(paymentMethod.id)
  }

  useEffect(() => {
    if (payment.length === 0) return
    if (selectedCardId && payment.some((c) => c.id === selectedCardId)) return

    const defaultCard = payment.find((card) => card.is_default)
    setSelectedCardId(defaultCard?.id ?? payment[0]?.id ?? null)
  }, [payment, selectedCardId, setSelectedCardId])

  const getCardIcon = (brand?: string | null) => {
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
          iconLeft={<PlusIcon color={"#FF6F61"} />}
          variant="secondary"
          size="sm"
          onClick={() => setShowAddCardModal(true)}
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
            selectedValue={selectedCardId ?? ""}
            onChange={(id) => setSelectedCardId(id || null)}
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

      {customer && (
        <div className="mt-sop-16px mb-sop-16px flex items-center gap-2">
          <Checkbox
            label="บันทึกไว้ใช้ครั้งถัดไป และตั้งเป็นค่าเริ่มต้น"
            checked={saveShippingAddress}
            onChange={(e) =>
              setSaveShippingAddress((e.target as HTMLInputElement).checked)
            }
          />
        </div>
      )}

      {error && (
        <p className="sop-body-xs-regular mt-sop-8px text-sop-system-error-400">
          {error}
        </p>
      )}

      {showAddCardModal && (
        <AddCardModal
          onClose={() => setShowAddCardModal(false)}
          onSuccess={handleAddCardSuccess}
        />
      )}
    </div>
  )
}

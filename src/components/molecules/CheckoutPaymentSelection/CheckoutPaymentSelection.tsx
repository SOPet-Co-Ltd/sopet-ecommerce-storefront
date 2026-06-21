"use client"

import { useEffect, useRef, useState } from "react"
import { Wallet } from "lucide-react"
import { FormProvider, useForm, useWatch } from "react-hook-form"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { QrCodeIcon, SubtractIcon } from "@/icons"
import { SelectWithCreditCard } from "./Components/CheckoutWithCredit"
import { SelectWithoutCreditCard } from "./Components/CheckoutWithoutCredit"
import { newCardDraftSchema } from "@/lib/checkout/checkout-payload-schema"

import type {
  PaymentFormData,
  CustomerCard,
  PaymentMethod,
} from "./Types/PaymentType"
import type { HttpTypes } from "@medusajs/types"

type Props = {
  payment?: CustomerCard[]
  paymentMethods?: HttpTypes.StorePaymentProvider[] | null
}

const CheckoutPaymentSelection = ({
  payment = [],
  paymentMethods = [],
}: Props) => {
  const methods = useForm<PaymentFormData>({
    mode: "onTouched",
    reValidateMode: "onBlur",
    defaultValues: {
      paymentMethod: "promptpay",
      cardNumber: "",
      cardName: "",
      expiry: "",
      cvv: "",
      setAsDefault: false,
    },
  })

  const selected = useCheckoutStore((state) => state.paymentMethod)
  const setPaymentMethod = useCheckoutStore((state) => state.setPaymentMethod)
  const selectedCardId = useCheckoutStore((state) => state.selectedCardId)
  const setPaymentFormTrigger = useCheckoutStore(
    (state) => state.setPaymentFormTrigger
  )

  const hasSavedCards = payment.length > 0
  const isCardSelected = selected === "card"
  const [cardSelectionError, setCardSelectionError] = useState<string | null>(
    null
  )

  const stateRef = useRef({ selected, selectedCardId, hasSavedCards })
  stateRef.current = { selected, selectedCardId, hasSavedCards }

  useEffect(() => {
    const trigger = async (): Promise<boolean> => {
      const { selected, selectedCardId, hasSavedCards } = stateRef.current

      if (selected !== "card") {
        setCardSelectionError(null)
        return true
      }

      if (hasSavedCards) {
        if (!selectedCardId) {
          setCardSelectionError("กรุณาเลือกบัตรที่ต้องการใช้ชำระเงิน")
          return false
        }
        setCardSelectionError(null)
        return true
      }

      return methods.trigger(["cardNumber", "cardName", "expiry", "cvv"])
    }

    setPaymentFormTrigger(trigger)
    return () => setPaymentFormTrigger(null)
  }, [setPaymentFormTrigger, methods])

  useEffect(() => {
    if (selectedCardId) {
      setCardSelectionError(null)
    }
  }, [selectedCardId])

  const enabledMethods = paymentMethods?.filter(
    (method) => (method as any).is_enabled !== false
  )

  const showPromptpay = enabledMethods?.some(
    (method) => method.id === "pp_promptpay_omise"
  )

  const showCard = enabledMethods?.some(
    (method) => method.id === "pp_card_omise"
  )

  return (
    <FormProvider {...methods}>
      <NewCardDraftSync />
      <div className="min-h-60 w-full rounded-sop-20 bg-sop-base-white p-sop-24px">
        <div className="flex items-center gap-sop-8px">
          <Wallet className="text-sop-primary-500" />

          <h2 className="sop-body-lg-medium text-sop-primary-500">
            วิธีการชำระเงิน
          </h2>
        </div>

        <div className="mt-sop-16px flex flex-col gap-sop-16px">
          {showPromptpay && (
            <SelectBox<PaymentMethod>
              name="payment"
              value="promptpay"
              selectedValue={selected as PaymentMethod}
              onChange={setPaymentMethod}
              rightIcon={<QrCodeIcon color="#9C6ADE" />}
            >
              QR Code / PromptPay
            </SelectBox>
          )}

          {showCard && (
            <>
              <SelectBox<PaymentMethod>
                name="payment"
                value="card"
                selectedValue={selected as PaymentMethod}
                onChange={setPaymentMethod}
                rightIcon={<SubtractIcon color="#9C6ADE" />}
              >
                บัตรเครดิต/บัตรเดบิต
              </SelectBox>

              {isCardSelected &&
                (hasSavedCards ? (
                  <SelectWithCreditCard
                    payment={payment}
                    error={cardSelectionError}
                  />
                ) : (
                  <SelectWithoutCreditCard />
                ))}
            </>
          )}
        </div>
      </div>
    </FormProvider>
  )
}

export default CheckoutPaymentSelection

function NewCardDraftSync() {
  const paymentMethod = useCheckoutStore((state) => state.paymentMethod)
  const selectedCardId = useCheckoutStore((state) => state.selectedCardId)
  const setNewCardDraft = useCheckoutStore((state) => state.setNewCardDraft)
  const values = useWatch<PaymentFormData>()

  useEffect(() => {
    if (paymentMethod !== "card" || selectedCardId) {
      setNewCardDraft(null)
      return
    }
    const parsed = newCardDraftSchema.safeParse({
      cardNumber: values?.cardNumber ?? "",
      cardName: values?.cardName ?? "",
      expiry: values?.expiry ?? "",
      cvv: values?.cvv ?? "",
      setAsDefault: values?.setAsDefault ?? false,
    })
    if (parsed.success) {
      setNewCardDraft(parsed.data)
    } else {
      setNewCardDraft(null)
    }
  }, [paymentMethod, selectedCardId, values, setNewCardDraft])

  return null
}

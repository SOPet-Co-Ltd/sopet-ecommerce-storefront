"use client"

import { Wallet } from "lucide-react"
import { FormProvider, useForm } from "react-hook-form"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { QrCodeIcon, SubtractIcon } from "@/icons"
import { SelectWithCreditCard } from "./Components/CheckoutWithCredit"
import { SelectWithoutCreditCard } from "./Components/CheckoutWithoutCredit"

import type {
  PaymentMethodData,
  PaymentFormData,
  CustomerCard,
  PaymentMethod,
} from "./Types/PaymentType"

type Props = {
  payment?: CustomerCard[]
  paymentMethods?: PaymentMethodData[] | null
}

const CheckoutPaymentSelection = ({
  payment = [],
  paymentMethods = [],
}: Props) => {
  const methods = useForm<PaymentFormData>({
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

  const hasSavedCards = payment.length > 0
  const isCardSelected = selected === "card"

  const enabledMethods = paymentMethods?.filter((method) => method.is_enabled)

  const showPromptpay = enabledMethods?.some(
    (method) => method.id === "pp_promptpay_omise"
  )

  const showCard = enabledMethods?.some(
    (method) => method.id === "pp_card_omise"
  )

  return (
    <FormProvider {...methods}>
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
                  <SelectWithCreditCard payment={payment} />
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

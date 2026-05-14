"use client"

import type { CustomerPaymentMethod } from "@/lib/data/customer"

type CreditCardFormProps = {
  onSuccess?: (paymentMethod: CustomerPaymentMethod) => void | Promise<void>
}

export const CreditCardCheckoutForm = (_props: CreditCardFormProps) => {
  return (
    <p className="sop-body-md-regular text-sop-system-error-400">
      ระบบบัตรเครดิตอยู่ระหว่างอัปเดต
    </p>
  )
}

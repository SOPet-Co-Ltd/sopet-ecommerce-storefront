"use client"

import { useParams, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { CreditCardForm } from "./CreditCardForm"

type CreditCardFormPageProps = {
  onCompleted?: () => void
  customer?: HttpTypes.StoreCustomer | null
}

export function CreditCardFormPage({
  onCompleted,
  customer: _customer,
}: CreditCardFormPageProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""

  const handleSuccess = () => {
    if (onCompleted) {
      onCompleted()
      return
    }

    router.push(`/${locale}/user/credit`)
  }

  return <CreditCardForm onSuccess={handleSuccess} />
}

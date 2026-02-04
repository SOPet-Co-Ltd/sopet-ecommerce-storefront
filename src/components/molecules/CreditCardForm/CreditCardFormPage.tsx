"use client"

import { useParams, useRouter } from "next/navigation"
import { CreditCardForm } from "./CreditCardForm"

type CreditCardFormPageProps = {
  /** Optional callback when the card is successfully saved. */
  onCompleted?: () => void
}

export function CreditCardFormPage({ onCompleted }: CreditCardFormPageProps) {
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

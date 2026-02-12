"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { CreditCardForm } from "./CreditCardForm"
import { toast } from "@/lib/helpers/toast"

type CreditCardFormPageProps = {
  /** Optional callback when the card is successfully saved. */
  onCompleted?: () => void
  customer?: HttpTypes.StoreCustomer | null
}

export function CreditCardFormPage({
  onCompleted,
  customer,
}: CreditCardFormPageProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""
  const [missingStripeCustomer, setMissingStripeCustomer] = useState(false)

  useEffect(() => {
    if (!customer) {
      return
    }
    const stripeId =
      typeof (customer.metadata as any)?.stripe_customer_id === "string"
        ? ((customer.metadata as any).stripe_customer_id as string)
        : ""

    if (!stripeId.trim()) {
      setMissingStripeCustomer(true)
      toast.error({
        title: "ไม่สามารถเพิ่มบัตรได้",
        description: "กรุณารีเฟรชหรือเข้าสู่ระบบใหม่",
      })
    }
  }, [customer])

  const handleSuccess = () => {
    if (onCompleted) {
      onCompleted()
      return
    }

    router.push(`/${locale}/user/credit`)
  }

  if (missingStripeCustomer) {
    return (
      <p className="sop-body-md-regular text-sop-system-error-400">
        ไม่สามารถเพิ่มบัตรได้ กรุณารีเฟรชหรือเข้าสู่ระบบใหม่
      </p>
    )
  }

  return <CreditCardForm onSuccess={handleSuccess} />
}

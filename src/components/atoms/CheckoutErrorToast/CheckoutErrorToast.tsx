"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "@/lib/helpers/toast"

const ERROR_MESSAGES: Record<string, { title: string; description?: string }> =
  {
    invalid_order_price: {
      title: "ไม่สามารถดำเนินการชำระเงินได้",
      description:
        "โปรโมชั่นไม่สามารถลดราคาสินค้าเป็น 0 ได้ กรุณาลบโค้ดส่วนลดบางรายการ",
    },
    payment_session_unavailable: {
      title: "ไม่พบข้อมูลการชำระเงิน",
      description: "กรุณาทำรายการใหม่อีกครั้ง",
    },
  }

export function CheckoutErrorToast() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error && ERROR_MESSAGES[error]) {
      const message = ERROR_MESSAGES[error]
      toast.error({
        title: message.title,
        description: message.description,
        duration: 5000,
      })

      // Clean up URL by removing error param (without page reload)
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  return null
}

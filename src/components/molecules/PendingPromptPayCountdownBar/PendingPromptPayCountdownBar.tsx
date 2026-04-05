"use client"

import { TimeIcon } from "@/icons"
import { usePaymentCountdown } from "@/hooks/usePaymentCountdown"
import {
  formatCountdownHms,
  getActivePendingPromptPaySession,
} from "@/lib/helpers/pending-payment-expiry"
import { resolveOrderCheckoutProviderId } from "@/lib/helpers/order-checkout-payment"
import { readOrderPromptPayContinuity } from "@/lib/helpers/order-promptpay-continuity"
import type { OrderDetails } from "@/types/order"

type PendingPromptPayCountdownBarProps = {
  order: Pick<
    OrderDetails,
    "id" | "payment_provider_id" | "payment_collections"
  >
  variant: "header" | "card"
}

export function PendingPromptPayCountdownBar({
  order,
  variant,
}: PendingPromptPayCountdownBarProps) {
  const checkoutProvider = resolveOrderCheckoutProviderId(order)
  const isPromptPay = Boolean(
    checkoutProvider?.toLowerCase().includes("promptpay")
  )

  let expiresAtMs: number | null = null
  if (isPromptPay) {
    const session = getActivePendingPromptPaySession(order)
    const secret =
      session?.data?.client_secret &&
      typeof session.data.client_secret === "string"
        ? session.data.client_secret
        : null
    const cont = readOrderPromptPayContinuity(order.id)
    /** Do not count down from Medusa session age until the customer has started QR (continuity written in modal/checkout). */
    expiresAtMs =
      secret && cont?.clientSecret === secret ? cont.qrExpiresAtMs : null
  }

  const { remainingSeconds, isExpired } = usePaymentCountdown(expiresAtMs)

  if (!isPromptPay || expiresAtMs == null || remainingSeconds === null) {
    return null
  }

  const { h, m, s } = formatCountdownHms(remainingSeconds)

  const inner = (
    <div
      className={
        variant === "card"
          ? "flex items-center justify-between md:justify-start gap-3 bg-sop-primary-200 rounded-sop-4px px-2 md:px-4 py-4"
          : "flex items-center justify-between md:justify-start gap-3 bg-sop-primary-200 rounded-sop-4px p-2"
      }
    >
      <div className="flex items-center gap-1">
        <TimeIcon size={18} color="#000000" />
        <p className="text-sop-base-black sop-body-sm-regular md:sop-body-md-regular">
          ชำระเงินผ่าน QR code ภายใน
        </p>
      </div>
      {isExpired ? (
        <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular font-medium">
          หมดเวลา
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
            {h}
          </p>
          <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
            :
          </p>
          <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
            {m}
          </p>
          <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
            :
          </p>
          <p className="text-sop-system-error-400 sop-body-sm-regular md:sop-body-md-regular">
            {s}
          </p>
        </div>
      )}
    </div>
  )

  if (variant === "card") {
    return (
      <div className="border-b border-sop-neutral-grayalpha-300 pb-3 md:pb-5">
        {inner}
      </div>
    )
  }

  return inner
}

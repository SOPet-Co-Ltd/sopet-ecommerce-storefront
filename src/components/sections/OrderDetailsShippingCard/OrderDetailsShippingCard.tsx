"use client"
import type { OrderShippingAddress } from "@/types/order"
import { Copy } from "lucide-react"

type OrderDetailsShippingCardProps = {
  address?: OrderShippingAddress | null
  tracking_number?: string | null
  tracking_url?: string | null
}

const OrderDetailsShippingCard = ({
  address,
  tracking_number,
  tracking_url,
}: OrderDetailsShippingCardProps) => {
  const handleCopyTrackingNumber = async () => {
    try {
      await navigator.clipboard.writeText(tracking_number || "")
    } catch (error) {
      console.error("Failed to copy tracking number:", error)
    }
  }

  if (!address) return null

  const hasTrackingInfo = Boolean(tracking_number || tracking_url)
  const trackingDisplayText = tracking_number || tracking_url || ""

  return (
    <div className="bg-sop-base-white px-4 py-3 md:px-10 md:py-5">
      {/* Top Row: Title & Back */}
      <div className="flex justify-between items-center mb-10 pb-2.5 border-b border-sop-neutral-grayalpha-300">
        <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
          การจัดส่ง
        </h2>
      </div>

      {hasTrackingInfo && (
        <div className="flex gap-3 mb-10">
          <span className="text-sop-primary-500 sop-body-md-medium w-28.5">
            หมายเลขพัสดุ
          </span>
          <div className="flex items-center gap-2">
            {tracking_url ? (
              <a
                href={tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="sop-body-md-regular text-sop-neutral-gray-300 hover:text-sop-primary-500 transition-colors underline"
              >
                {trackingDisplayText}
              </a>
            ) : (
              <p className="sop-body-md-regular text-sop-neutral-gray-300">
                {trackingDisplayText}
              </p>
            )}
            {tracking_number && (
              <button
                className={`transition-colors text-gray-400 hover:text-gray-600`}
                onClick={handleCopyTrackingNumber}
                title="Copy tracking number"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <span className="text-sop-primary-500 sop-body-md-medium w-28.5">
          ที่อยู่สำหรับจัดส่ง
        </span>
        <div className="flex flex-col gap-5 flex-1">
          <p className="sop-body-md-regular text-sop-neutral-gray-300">
            {address.first_name} {address.last_name} {address.phone}
          </p>
          <p className="sop-body-md-regular text-sop-neutral-gray-300">
            {address.address_1} {address.address_2} {address.city}{" "}
            {address.province} {address.postal_code}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsShippingCard

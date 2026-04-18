"use client"
import type { OrderShippingAddress } from "@/types/order"
import { Copy } from "lucide-react"

type ShippingGroup = {
  sellerId: string
  sellerName: string
  statusLabel: string
  trackingLabels: Array<{
    tracking_number: string | null
    tracking_url: string | null
  }>
}

type OrderDetailsShippingCardProps = {
  address?: OrderShippingAddress | null
  shippingGroups?: ShippingGroup[]
}

const OrderDetailsShippingCard = ({
  address,
  shippingGroups = [],
}: OrderDetailsShippingCardProps) => {
  const handleCopyTrackingNumber = async (trackingNumber: string | null) => {
    try {
      await navigator.clipboard.writeText(trackingNumber || "")
    } catch (error) {
      console.error("Failed to copy tracking number:", error)
    }
  }

  if (!address) return null

  const groupsWithTracking = shippingGroups.filter(
    (group) => group.trackingLabels.length > 0
  )

  return (
    <div className="bg-sop-base-white px-4 py-3 md:px-10 md:py-5">
      {/* Top Row: Title & Back */}
      <div className="flex justify-between items-center mb-10 pb-2.5 border-b border-sop-neutral-grayalpha-300">
        <h2 className="sop-headline-sm-medium text-sop-neutral-gray-200">
          การจัดส่ง
        </h2>
      </div>

      {groupsWithTracking.length > 0 && (
        <div className="flex gap-3 mb-10">
          <span className="text-sop-primary-500 sop-body-md-medium w-28.5">
            หมายเลขพัสดุ
          </span>
          <div className="flex flex-col gap-4 flex-1">
            {groupsWithTracking.map((group) => (
              <div key={group.sellerId} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="sop-body-md-medium text-sop-neutral-gray-300">
                    {group.sellerName}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {group.trackingLabels.map((label, index) => {
                    const trackingDisplayText =
                      label.tracking_number || label.tracking_url || ""

                    return (
                      <div
                        key={`${group.sellerId}-${trackingDisplayText}-${index}`}
                        className="flex items-center gap-2"
                      >
                        {label.tracking_url ? (
                          <a
                            href={label.tracking_url}
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
                        {label.tracking_number && (
                          <button
                            className={`transition-colors text-gray-400 hover:text-gray-600`}
                            onClick={() =>
                              handleCopyTrackingNumber(label.tracking_number)
                            }
                            title="Copy tracking number"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
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

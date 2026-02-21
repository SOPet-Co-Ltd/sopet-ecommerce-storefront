import { Check, ClipboardList, CreditCard, Package, Truck } from "lucide-react"
import { useMemo } from "react"

type OrderStatusStepperProps = {
  paymentStatus: string
  fulfillmentStatus: string
  status: string
}

const OrderStatusStepper = ({
  paymentStatus,
  fulfillmentStatus,
  status,
}: OrderStatusStepperProps) => {
  const currentStep = useMemo(() => {
    if (status === "canceled") return -1
    if (paymentStatus === "awaiting") return 0
    if (fulfillmentStatus === "not_fulfilled" && paymentStatus === "captured")
      return 1 // Paid, preparing to ship
    if (fulfillmentStatus === "shipped") return 2
    if (fulfillmentStatus === "fulfilled" || fulfillmentStatus === "delivered")
      return 3
    return 0
  }, [paymentStatus, fulfillmentStatus, status])

  const steps = [
    {
      label: "ที่ต้องชำระ",
      icon: CreditCard,
    },
    {
      label: "เตรียมการจัดส่ง",
      icon: ClipboardList,
    },
    {
      label: "ที่ต้องได้รับ",
      icon: Truck,
    },
    {
      label: "สำเร็จ",
      icon: Check, // Or Package
    },
  ]

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2" />

        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 h-1 bg-sop-secondary-500 -z-10 transform -translate-y-1/2 transition-all duration-300"
          style={{
            width: `${(Math.max(0, currentStep) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentStep
          const isCurrent = index === currentStep

          return (
            <div
              key={index}
              className="flex flex-col items-center gap-2 bg-white px-2"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive
                    ? "bg-sop-secondary-500 border-sop-secondary-500 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              <p
                className={`text-xs md:text-sm font-medium ${
                  isActive ? "text-sop-secondary-500" : "text-gray-400"
                }`}
              >
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default OrderStatusStepper

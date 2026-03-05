import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ArrowLeft } from "lucide-react"

type OrderDetailsHeaderProps = {
  orderId: string
  status: string
}

const OrderDetailsHeader = ({ orderId, status }: OrderDetailsHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <LocalizedClientLink href="/user/orders">
          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base font-medium">ย้อนกลับ</span>
          </button>
        </LocalizedClientLink>
      </div>

      <div className="flex items-center justify-between mt-2">
        <h1 className="text-2xl font-bold text-gray-900">
          รายละเอียดคำสั่งซื้อ
        </h1>
        <div className="flex flex-col items-end">
          <span className="text-sm text-gray-500">
            หมายเลขคำสั่งซื้อ #{orderId}
          </span>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsHeader

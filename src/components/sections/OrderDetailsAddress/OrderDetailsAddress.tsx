import { MapPin } from "lucide-react"

type OrderDetailsAddressProps = {
  address: any // Refine type later based on Medusa Order Address
}

const OrderDetailsAddress = ({ address }: OrderDetailsAddressProps) => {
  if (!address) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-sop-secondary-500" />
        <h3 className="font-medium text-gray-900">ที่อยู่ในการจัดส่ง</h3>
      </div>
      <div className="p-4">
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <p className="font-medium text-gray-900">
            {address.first_name} {address.last_name}
          </p>
          <p>{address.phone}</p>
          <p>
            {address.address_1} {address.address_2 ? address.address_2 : ""}
            <br />
            {address.city} {address.province} {address.postal_code}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsAddress

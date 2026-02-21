type OrderDetailsShippingCardProps = {
  address: any
}

const OrderDetailsShippingCard = ({
  address,
}: OrderDetailsShippingCardProps) => {
  if (!address) return null

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
      <h3 className="font-bold text-gray-900 mb-4 text-base">การจัดส่ง</h3>
      <div className="border-t border-gray-100 pt-4 flex flex-col md:flex-row gap-4 md:gap-12">
        <span className="text-sop-primary-500 font-medium text-sm whitespace-nowrap min-w-[100px]">
          ที่อยู่สำหรับจัดส่ง
        </span>
        <div className="text-sm text-gray-900">
          <p className="mb-1">
            {address.first_name} {address.last_name} {address.phone}
          </p>
          <p className="text-gray-600">
            {address.address_1} {address.address_2} {address.city}{" "}
            {address.province} {address.postal_code}
          </p>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsShippingCard

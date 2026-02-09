import { Text } from "@medusajs/ui"
import { Cart } from "@/types/cart"
import Spinner from "@/icons/spinner"

type ShippingAddressSummaryProps = {
  cart: Cart
  onEdit: () => void
}

const ShippingAddressSummary = ({
  cart,
  onEdit,
}: ShippingAddressSummaryProps) => {
  if (!cart || !cart.shipping_address) {
    return (
      <div>
        <Spinner />
      </div>
    )
  }

  const { shipping_address } = cart

  return (
    <div className="text-small-regular ">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-4 w-full items-start">
        {/* Column 1: Name and Phone */}
        <div className="flex flex-col gap-1">
          <Text className="sop-body-md-regular md:sop-headline-sm-regular">
            {shipping_address.first_name} {shipping_address.last_name}
          </Text>
          <Text className="sop-body-md-regular md:sop-headline-sm-regular text-sop-neutral-gray-300">
            {shipping_address.phone}
          </Text>
        </div>

        {/* Column 2: Address Details */}
        <div className="flex flex-col gap-1">
          <Text className="md:sop-body-lg-regular sop-body-sm-regular text-sop-neutral-gray-300">
            {shipping_address.address_1}
            {shipping_address.address_2
              ? ` ${shipping_address.address_2}`
              : ""}{" "}
            {shipping_address.city} {shipping_address.province}{" "}
            {shipping_address.country_code?.toUpperCase() === "TH"
              ? ""
              : shipping_address.country_code?.toUpperCase()}
            {shipping_address.postal_code}
          </Text>
        </div>

        {/* Column 3: Default Badge and Edit Link */}
        <div className="flex flex-row items-center gap-10 justify-end">
          <span className="text-sop-secondary-500 sop-body-2xs-regular md:sop-body-md-regular">
            ค่าเริ่มต้น
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="sop-link-xs-regular md:sop-link-md-regular text-sop-neutral-gray-300 underline cursor-pointer"
          >
            เปลี่ยน
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShippingAddressSummary

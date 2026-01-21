"use client"

import { Heading, useToggleState } from "@medusajs/ui"
import { setAddresses } from "@/lib/data/cart"
import compareAddresses from "@/lib/helpers/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/atoms"
import ErrorMessage from "@/components/molecules/ErrorMessage/ErrorMessage"
import ShippingAddress from "@/components/organisms/ShippingAddress/ShippingAddress"
import { MapPin } from "lucide-react"
import { Cart } from "@/types/cart"
import ShippingAddressSummary from "@/components/molecules/ShippingAddressSummary/ShippingAddressSummary"

import { GuestOTPDialog } from "@/components/organisms/GuestOTPDialog/GuestOTPDialog"

export const CartAddressSection = ({
  cart,
  customer,
}: {
  cart: Cart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isOTPVerified, setIsOTPVerified] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")

  const isAddress = Boolean(
    cart?.shipping_address &&
    cart?.shipping_address.first_name &&
    cart?.shipping_address.last_name &&
    cart?.shipping_address.address_1 &&
    cart?.shipping_address.city &&
    cart?.shipping_address.postal_code &&
    cart?.shipping_address.country_code
  )
  const isOpen = searchParams.get("step") === "address" || !isAddress

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const [message, formAction] = useActionState(setAddresses, null)

  useEffect(() => {
    if (!isAddress) {
      router.replace(pathname + "?step=address")
    }
  }, [isAddress])

  const handleEdit = () => {
    router.replace(pathname + "?step=address")
  }

  const handleVerified = (phone: string) => {
    setPhoneNumber(phone)
    setIsOTPVerified(true)
  }

  // Show OTP Dialog if not logged in and not verified
  const showOTPDialog = !customer && !isOTPVerified && isOpen

  const MOCK_ADDRESS = {
    first_name: "สมชาย",
    last_name: "ใจดี",
    phone: "081-234-5678",
    address_1: "123/45 หมู่ 6 ถนนสุขุมวิท",
    address_2: "แขวงคลองตัน",
    city: "เขตคลองเตย",
    province: "กรุงเทพมหานคร",
    postal_code: "10110",
    country_code: "th",
  }

  return (
    <div className="p-4 rounded-xs  bg-sop-base-white relative">
      <GuestOTPDialog isOpen={showOTPDialog} onVerified={handleVerified} />

      <div className="flex flex-row items-center justify-between mb-6 border-b border-sop-neutral-gray py-2">
        <Heading
          level="h2"
          className="flex flex-row text-3xl-regular gap-x-2  items-center text-ui-fg-base"
        >
          <MapPin className="text-purple-600" />
          <span className="text-lg font-normal text-purple-600">
            ที่อยู่ในการจัดส่ง
          </span>
        </Heading>
      </div>

      <form
        action={async (data) => {
          await formAction(data)
          router.replace(`${pathname}?step=delivery`)
          router.refresh()
        }}
      >
        {isOpen ? (
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              checked={sameAsBilling}
              onChange={toggleSameAsBilling}
              cart={cart}
              prefilledPhone={phoneNumber}
            />
            <Button className="mt-6" data-testid="submit-address-button">
              บันทึกและดำเนินการต่อ
            </Button>
            <ErrorMessage
              error={message !== "success" ? message : undefined}
              data-testid="address-error-message"
            />
          </div>
        ) : (
          <div>
            {cart && <ShippingAddressSummary cart={cart} onEdit={handleEdit} />}
          </div>
        )}
      </form>
    </div>
  )
}

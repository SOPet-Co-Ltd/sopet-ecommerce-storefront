import { useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"

import { Infotag } from "@/components/atoms/InfoTag/Infotag"
import { Button } from "@/components/atoms"
import { Dot } from "lucide-react"
import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"
import { useIsMobile } from "@/lib/utils/is-mobile"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import type { AddressFormData } from "../../AddressForm/schema"
import { customerAddressToFormValues } from "../customerAddressToFormValues"
import AddressModal from "./AddressModal.tsx/AddressModal"

const AddressFilledState = ({
  customer,
}: {
  customer: StoreCustomer | null
}) => {
  const isMobile = useIsMobile()
  const { reset } = useFormContext<AddressFormData>()
  const addressId = useWatch({ name: "addressId" })
  const customerAddresses = useCheckoutStore((state) => state.customerAddresses)
  const setCustomerAddresses = useCheckoutStore(
    (state) => state.setCustomerAddresses
  )
  const storeCustomer = useCheckoutStore((state) => state.customer)
  const setCustomer = useCheckoutStore((state) => state.setCustomer)

  const [openModal, setOpenModal] = useState(false)

  const addresses =
    customerAddresses.length > 0
      ? customerAddresses
      : (customer?.addresses ?? [])

  const address =
    addresses.find((a: StoreCustomerAddress) => a.id === addressId) ??
    addresses.find((a: StoreCustomerAddress) => a.is_default_shipping)

  const handleConfirmAddress = (selectedId: string) => {
    const selected = addresses.find((a) => a.id === selectedId)
    if (!selected) return

    reset(customerAddressToFormValues(selected, customer))
    setOpenModal(false)
  }

  const fullAddress = `${address?.address_1} ${address?.address_2} ${address?.city} ${address?.province} ${address?.postal_code}`

  return (
    <>
      {openModal && (
        <AddressModal
          customer={customer}
          initialSelectedId={addressId || address?.id || ""}
          onClose={() => setOpenModal(false)}
          onConfirm={handleConfirmAddress}
          onAddressesChange={(next) => {
            setCustomerAddresses(next)
            if (storeCustomer) {
              setCustomer({ ...storeCustomer, addresses: next })
            }

            if (addressId && !next.some((a) => a.id === addressId)) {
              const fallback =
                next.find((a) => a.is_default_shipping) ?? next[0]
              if (fallback) {
                reset(customerAddressToFormValues(fallback, customer))
              }
            }
          }}
        />
      )}

      {isMobile ? (
        <div className="flex gap-3">
          <div className="flex flex-col w-full">
            <div className="flex gap-2 sop-body-sm-medium">
              <label>{address?.address_name}</label>
              <label>({address?.phone})</label>
            </div>

            <label className="sop-body-sm-regular">{fullAddress}</label>

            <div className="item-center justify-between flex mt-sop-16px">
              {address?.is_default_shipping ? (
                <Infotag
                  className="sop-body-sm-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 pr-2.5"
                  leftIcon={<Dot size={32} />}
                >
                  ค่าเริ่มต้น
                </Infotag>
              ) : null}

              <Button
                type="button"
                variant="outline"
                size="sm"
                rounded="rounded"
                onClick={() => setOpenModal(true)}
              >
                เปลี่ยน
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="pr-5.5">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <label>{address?.address_name}</label>
                <label>({address?.phone})</label>
              </div>

              {address?.is_default_shipping ? (
                <Infotag
                  className="sop-body-sm-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 pr-2.5"
                  leftIcon={<Dot size={32} />}
                >
                  ค่าเริ่มต้น
                </Infotag>
              ) : null}
            </div>

            <label className="sop-body-md-regular">{fullAddress}</label>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            rounded="rounded"
            onClick={() => setOpenModal(true)}
          >
            เปลี่ยน
          </Button>
        </div>
      )}
    </>
  )
}

export default AddressFilledState

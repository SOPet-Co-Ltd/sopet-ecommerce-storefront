"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/atoms"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { Modal } from "@/components/molecules/Modal/Modal"

import { PlusIcon } from "@/icons"

import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"
import { updateCustomerAddress } from "@/lib/data/customer"

type AddressModalProps = {
  onClose: () => void
  onConfirm: (addressId: string) => void
  initialSelectedId?: string
  customer: StoreCustomer | null
}

const AddressModal = ({
  onClose,
  onConfirm,
  initialSelectedId = "",
  customer,
}: AddressModalProps) => {
  const [addresses, setAddresses] = useState(customer?.addresses || [])

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort(
      (a, b) => Number(b.is_default_shipping) - Number(a.is_default_shipping)
    )
  }, [addresses])

  const [selectedAddress, setSelectedAddress] = useState(initialSelectedId)

  useEffect(() => {
    setSelectedAddress(initialSelectedId)
  }, [initialSelectedId])

  const handleSetDefault = async (address: StoreCustomerAddress) => {
    const formData = new FormData()

    formData.append("addressId", address.id)
    formData.append("address_name", address.address_name || "")
    formData.append("first_name", address.first_name || "")
    formData.append("last_name", address.last_name || "")
    formData.append("company", address.company || "")
    formData.append("address_1", address.address_1 || "")
    formData.append("address_2", address.address_2 || "")
    formData.append("city", address.city || "")
    formData.append("postal_code", address.postal_code || "")
    formData.append("province", address.province || "")
    formData.append("country_code", address.country_code || "")
    formData.append("phone", address.phone || "")

    formData.append("isDefaultShipping", "true")

    const result = await updateCustomerAddress(formData)

    if (!result.success) {
      console.error(result.error)
      return
    }

    setAddresses((prev) =>
      prev.map((item) => ({
        ...item,
        is_default_shipping: item.id === address.id,
      }))
    )

    setSelectedAddress(address.id)
  }

  return (
    <Modal
      onClose={onClose}
      header={
        <div className="flex flex-row justify-between content-center pt-4 mb-3">
          <h2 className="sop-body-lg-medium text-sop-neutral-gray-200">
            ข้อมูลการจัดส่ง
          </h2>

          <Button
            variant="outline"
            size="sm"
            className="text-sop-secondary-500"
            iconLeft={<PlusIcon size={16} color="currentColor" />}
          >
            เพิ่มที่อยู่ใหม่
          </Button>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="filled" fill size="lg">
            ยกเลิก
          </Button>
          <Button
            fill
            size="lg"
            disabled={!selectedAddress}
            onClick={() => onConfirm(selectedAddress)}
          >
            ยืนยัน
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {sortedAddresses.map((address: StoreCustomerAddress) => {
          const fullAddress = [
            address.address_1,
            address.address_2,
            address.city,
            address.province,
            address.postal_code,
          ]
            .filter(Boolean)
            .join(" ")

          return (
            <SelectBox
              key={address.id}
              name="address"
              value={address.id}
              selectedValue={selectedAddress}
              onChange={setSelectedAddress}
            >
              <div className="pointer-events-auto flex flex-col text-sop-neutral-gray-200">
                <div className="flex justify-between w-full">
                  <div className="max-w-75">
                    <div className="flex">
                      <span className="sop-body-sm-regular pr-3">
                        {address.address_name}
                      </span>

                      <span className="sop-body-sm-regular">
                        {address.phone}
                      </span>
                    </div>

                    <span className="sop-body-sm-regular block">
                      {fullAddress}
                    </span>

                    <div className="mt-sop-12px">
                      {address.is_default_shipping ? (
                        <span className="sop-body-xs-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 px-2.5 py-1">
                          ค่าเริ่มต้น
                        </span>
                      ) : (
                        <Button
                          type="button"
                          variant="filled"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(address)
                          }}
                          className="sop-body-xs-medium text-sop-neutral-gray-200"
                        >
                          ตั้งเป็นค่าเริ่มต้น
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {!address.is_default_shipping ? (
                      <Button
                        type="button"
                        variant="filled"
                        className="text-sop-neutral-gray-200"
                      >
                        ลบ
                      </Button>
                    ) : null}

                    <Link href={`/user/addresses/${address.id}/edit`}>
                      <Button
                        type="button"
                        variant="filled"
                        className="text-sop-neutral-gray-200"
                      >
                        แก้ไข
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </SelectBox>
          )
        })}
      </div>
    </Modal>
  )
}

export default AddressModal

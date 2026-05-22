"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/atoms"
import { SelectBox } from "@/components/atoms/SelectBox/SelectBox"
import { Modal } from "@/components/molecules/Modal/Modal"

import { PlusIcon } from "@/icons"

import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"
import {
  updateCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/data/customer"
import { useIsMobile } from "@/lib/utils/is-mobile"
import DeleteAddress from "./DeleteAddress"
import EditAddress from "./EditAddress"

type AddressModalProps = {
  onClose: () => void
  onConfirm: (addressId: string) => void
  onAddressesChange?: (addresses: StoreCustomerAddress[]) => void
  initialSelectedId?: string
  customer: StoreCustomer | null
}

const syncAddresses = (
  next: StoreCustomerAddress[],
  onAddressesChange?: (addresses: StoreCustomerAddress[]) => void
) => {
  onAddressesChange?.(next)
}

const AddressModal = ({
  onClose,
  onConfirm,
  onAddressesChange,
  initialSelectedId = "",
  customer,
}: AddressModalProps) => {
  const [addresses, setAddresses] = useState(customer?.addresses || [])

  const patchAddresses = (
    updater: (prev: StoreCustomerAddress[]) => StoreCustomerAddress[]
  ) => {
    setAddresses((prev) => {
      const next = updater(prev)
      syncAddresses(next, onAddressesChange)
      return next
    })
  }

  const sortedAddresses = useMemo(() => {
    return [...addresses].sort(
      (a, b) => Number(b.is_default_shipping) - Number(a.is_default_shipping)
    )
  }, [addresses])

  const [selectedAddress, setSelectedAddress] = useState(initialSelectedId)
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState<StoreCustomerAddress | null>(
    null
  )

  const isMobile = useIsMobile()

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

    patchAddresses((prev) =>
      prev.map((item) => ({
        ...item,
        is_default_shipping: item.id === address.id,
      }))
    )

    setSelectedAddress(address.id)
  }

  const removeAddressFromList = (addressId: string) => {
    patchAddresses((prev) => prev.filter((item) => item.id !== addressId))

    if (selectedAddress === addressId) {
      setSelectedAddress("")
    }
  }

  const handleDeleteAddress = async () => {
    if (!deleteAddressId) return

    const result = await deleteCustomerAddress(deleteAddressId)

    if (!result.success) {
      console.error(result.error)
      return
    }

    removeAddressFromList(deleteAddressId)
    setDeleteAddressId(null)
  }

  if (deleteAddressId) {
    return (
      <DeleteAddress
        onClose={() => setDeleteAddressId(null)}
        onConfirm={handleDeleteAddress}
      />
    )
  }
  if (editAddress) {
    return (
      <EditAddress
        address={editAddress}
        onClose={() => setEditAddress(null)}
        onDeleted={(addressId) => {
          removeAddressFromList(addressId)
          setEditAddress(null)
        }}
        onUpdated={(updatedAddress) => {
          patchAddresses((prev) =>
            prev.map((item) =>
              item.id === updatedAddress.id
                ? {
                    ...item,
                    ...updatedAddress,
                    is_default_shipping:
                      updatedAddress.is_default_shipping ??
                      item.is_default_shipping,
                    is_default_billing:
                      updatedAddress.is_default_billing ??
                      item.is_default_billing,
                  }
                : item
            )
          )

          setEditAddress(null)
        }}
      />
    )
  }

  return (
    <>
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
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
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
                radioTopOnMobile
              >
                <div className="pointer-events-auto flex flex-col text-sop-neutral-gray-200">
                  <div className="flex justify-between w-full">
                    <div className="max-w-75 flex-1">
                      <div
                        className={`flex ${
                          isMobile
                            ? "flex-wrap items-center gap-x-1 gap-y-0.5"
                            : "items-center"
                        }`}
                      >
                        <span className="lg:sop-body-sm-regular md:sop-body-sm-regular sop-body-xs-regular wrap-break-word pr-2">
                          {address.address_name}
                        </span>

                        <span className="lg:sop-body-sm-regular md:sop-body-sm-regular sop-body-xs-regular whitespace-nowrap">
                          ({address.phone})
                        </span>
                      </div>

                      <span className="lg:sop-body-sm-regular md:sop-body-sm-regular sop-body-xs-light block">
                        {fullAddress}
                      </span>

                      {isMobile ? (
                        <div className="mt-sop-12px flex flex-wrap items-center gap-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {address.is_default_shipping ? (
                              <span className="sop-body-xs-medium bg-sop-secondary-100 text-sop-secondary-500 rounded-sop-16 px-2.5 py-1">
                                ค่าเริ่มต้น
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="filled"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSetDefault(address)
                                }}
                                className="sop-body-xs-light text-sop-neutral-gray-200 shrink-0"
                              >
                                ตั้งเป็นค่าเริ่มต้น
                              </Button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            {!address.is_default_shipping ? (
                              <Button
                                size="sm"
                                type="button"
                                variant="filled"
                                className="text-sop-neutral-gray-200 shrink-0 whitespace-nowrap"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteAddressId(address.id)
                                }}
                              >
                                ลบ
                              </Button>
                            ) : null}

                            <Button
                              size="sm"
                              type="button"
                              variant="filled"
                              className="text-sop-neutral-gray-200 shrink-0 whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditAddress(address)
                              }}
                            >
                              แก้ไข
                            </Button>
                          </div>
                        </div>
                      ) : (
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
                      )}
                    </div>

                    {!isMobile && (
                      <div className="flex gap-2 shrink-0">
                        {!address.is_default_shipping ? (
                          <Button
                            type="button"
                            variant="filled"
                            className="text-sop-neutral-gray-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteAddressId(address.id)
                            }}
                          >
                            ลบ
                          </Button>
                        ) : null}

                        <Button
                          type="button"
                          variant="filled"
                          className="text-sop-neutral-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditAddress(address)
                          }}
                        >
                          แก้ไข
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SelectBox>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

export default AddressModal

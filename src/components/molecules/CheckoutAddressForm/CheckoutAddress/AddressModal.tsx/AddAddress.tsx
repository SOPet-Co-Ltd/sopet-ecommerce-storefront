"use client"

import { FormProvider, useForm } from "react-hook-form"

import { Modal } from "@/components/molecules/Modal/Modal"
import AddressEmptyState from "../AddressEmptyState"
import { Button } from "@/components/atoms"

import { StoreCustomer, StoreCustomerAddress } from "@medusajs/types"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  AddressFormData,
  addressSchema,
} from "@/components/molecules/AddressForm/schema"

import { addCustomerAddress } from "@/lib/data/customer"

type AddAddressProps = {
  onClose: () => void
  onAdd: (address: StoreCustomerAddress) => void
  customer: StoreCustomer | null
}

const AddAddress = ({ onAdd, onClose, customer }: AddAddressProps) => {
  const methods = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      address: "",
      district: "",
      subDistrict: "",
      province: "",
      postalCode: "",
      recipientFullName: "",
      phone: "",
      contactPhone: "",
      email: "",
      setAsDefault: false,
    },
  })

  const handleSubmit = async (data: AddressFormData) => {
    const [firstName = "", ...lastNameParts] = data.recipientFullName
      .trim()
      .split(" ")

    const lastName = lastNameParts.join(" ")

    const formData = new FormData()

    formData.append("address_name", data.recipientFullName)
    formData.append("first_name", firstName)
    formData.append("last_name", lastName)

    formData.append("address_1", data.address)
    formData.append("address_2", "")

    formData.append("city", data.district)
    formData.append("province", data.province)

    formData.append("postal_code", data.postalCode)
    formData.append("country_code", "th")

    formData.append("phone", data.phone)

    if (data.setAsDefault) {
      formData.append("isDefaultShipping", "1")
      formData.append("isDefaultBilling", "1")
    }

    const result = await addCustomerAddress(formData)

    if (!result.success) {
      console.error(result.error)
      return
    }

    const newAddress = result.customer?.addresses?.find(
      (address: StoreCustomerAddress) =>
        address.address_1 === data.address && address.phone === data.phone
    )

    if (newAddress) {
      onAdd(newAddress)
    }

    onClose()
  }

  return (
    <FormProvider {...methods}>
      <Modal
        header={
          <div className="flex justify-center">
            <h2 className="sop-body-lg-medium text-sop-neutral-gray-200">
              เพิ่มข้อมูลการจัดส่ง
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <Button onClick={onClose} variant="filled" fill size="lg">
              ยกเลิก
            </Button>

            <Button fill size="lg" onClick={methods.handleSubmit(handleSubmit)}>
              เพิ่มที่อยู่
            </Button>
          </div>
        }
        onClose={onClose}
      >
        <AddressEmptyState storeCustomer={customer} />
      </Modal>
    </FormProvider>
  )
}

export default AddAddress

"use client"

import { FormProvider, useForm } from "react-hook-form"
import { useState } from "react"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate placeholder email if customer doesn't have one
  const generatePlaceholderEmail = () => {
    if (customer && !customer.email && customer.phone) {
      return `${customer.phone}@sopet.org`
    }
    return customer?.email || ""
  }

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
      contactPhone: customer?.phone ?? "",
      email: generatePlaceholderEmail(),
      setAsDefault: false,
    },
  })

  const handleSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true)
    setError(null)

    const [firstName = "", ...lastNameParts] = data.recipientFullName
      .trim()
      .split(" ")

    const lastName = lastNameParts.join(" ")

    const formData = new FormData()

    formData.append("address_name", data.recipientFullName)
    formData.append("first_name", firstName)
    formData.append("last_name", lastName)

    formData.append("address_1", data.address)
    formData.append("address_2", data.district)

    formData.append("city", data.subDistrict)
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
      setError(result.error || "ไม่สามารถเพิ่มที่อยู่ได้ กรุณาลองใหม่อีกครั้ง")
      setIsSubmitting(false)
      return
    }

    const newAddress = result.customer?.addresses?.find(
      (address: StoreCustomerAddress) =>
        address.address_1 === data.address && address.phone === data.phone
    )

    if (newAddress) {
      onAdd(newAddress)
    }

    setIsSubmitting(false)
    onClose()
  }

  return (
    <FormProvider {...methods}>
      <Modal
        header={
          <div className="flex justify-center">
            <h2
              id="add-address-title"
              className="sop-body-lg-medium text-sop-neutral-gray-200"
            >
              เพิ่มข้อมูลการจัดส่ง
            </h2>
          </div>
        }
        footer={
          <div className="flex flex-col gap-2 md:flex-row md:justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="filled"
              fill
              size="lg"
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>

            <Button
              type="button"
              fill
              size="lg"
              onClick={methods.handleSubmit(handleSubmit)}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              aria-label={
                isSubmitting
                  ? "กำลังบันทึกที่อยู่ กรุณารอสักครู่"
                  : "เพิ่มที่อยู่"
              }
            >
              {isSubmitting ? "กำลังบันทึก..." : "เพิ่มที่อยู่"}
            </Button>
          </div>
        }
        onClose={onClose}
        aria-labelledby="add-address-title"
      >
        <AddressEmptyState storeCustomer={customer} isAdding={true} />
        {error && (
          <p
            className="text-red-500 text-sm mt-2 px-4"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
        {/* Screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isSubmitting && "กำลังบันทึกที่อยู่ กรุณารอสักครู่"}
        </div>
      </Modal>
    </FormProvider>
  )
}

export default AddAddress

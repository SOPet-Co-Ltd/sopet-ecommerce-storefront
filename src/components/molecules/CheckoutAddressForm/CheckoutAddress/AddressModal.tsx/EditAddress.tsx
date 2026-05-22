"use client"

import { useEffect, useMemo, useState } from "react"
import { Controller, FieldError, Path, useFormContext } from "react-hook-form"
import { Button, Checkbox, InputSOPet } from "@/components/atoms"
import AddressDropdown from "../AddressDropdown"
import { AddressFormData } from "@/components/molecules/AddressForm/schema"
import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
  trimValue,
} from "@/lib/data/thai-address-helpers"
import { Modal } from "@/components/molecules/Modal/Modal"
import { StoreCustomerAddress } from "@medusajs/types"
import DeleteAddress from "./DeleteAddress"
import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@/lib/data/customer"

type Props = {
  address: StoreCustomerAddress
  onClose: () => void
  onUpdated: (updatedAddress: StoreCustomerAddress) => void
  onDeleted: (addressId: string) => void
  onSubmitForm?: () => void
}

const EditAddress = ({
  address,
  onClose,
  onUpdated,
  onDeleted,
  onSubmitForm: _onSubmitForm,
}: Props) => {
  const {
    control,
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useFormContext<AddressFormData>()

  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const provinceValue = watch("province")
  const districtValue = watch("district")
  const postalCodeValue = watch("postalCode")

  const provinceOptions = useMemo(() => getProvinces(), [])

  const districtOptions = useMemo(
    () => getDistricts(provinceValue),
    [provinceValue]
  )

  const subdistrictOptions = useMemo(
    () => getSubdistrictsWithPostal(provinceValue, districtValue),
    [provinceValue, districtValue]
  )

  const resetFields = (fields: Path<AddressFormData>[]) => {
    fields.forEach((field) => {
      setValue(field, "")
    })
  }

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 10)

    if (numbers.length <= 3) return numbers

    if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    }

    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }

  useEffect(() => {
    setValue("address", address.address_1 || "")
    setValue("province", address.province || "")
    setValue("district", address.address_2 || "")
    setValue("subDistrict", address.city || "")
    setValue("postalCode", address.postal_code || "")
    setValue("phone", address.phone || "")

    setValue(
      "recipientFullName",
      `${address.first_name || ""} ${address.last_name || ""}`.trim()
    )

    setValue("setAsDefault", !!address.is_default_shipping)
  }, [address, setValue])
  const onSubmit = async (data: AddressFormData) => {
    try {
      const [firstName = "", ...lastNameParts] =
        data.recipientFullName.split(" ")

      const lastName = lastNameParts.join(" ")

      const formData = new FormData()

      formData.append("addressId", address.id)
      formData.append("address_name", data.recipientFullName)
      formData.append("first_name", firstName)
      formData.append("last_name", lastName)

      formData.append("address_1", data.address)
      formData.append("address_2", data.district)
      formData.append("city", data.subDistrict)
      formData.append("province", data.province)
      formData.append("postal_code", data.postalCode)

      formData.append("country_code", "th")

      formData.append("phone", data.phone.replace(/\D/g, ""))

      if (data.setAsDefault) {
        formData.append("isDefaultShipping", "1")
        formData.append("isDefaultBilling", "1")
      }

      const result = await updateCustomerAddress(formData)

      if (!result.success) {
        console.error(result.error)
        return
      }

      onUpdated({
        ...address,

        address_1: data.address,
        address_2: data.district,
        city: data.subDistrict,
        province: data.province,
        postal_code: data.postalCode,

        phone: data.phone.replace(/\D/g, ""),

        first_name: firstName,
        last_name: lastName,
        address_name: data.recipientFullName,

        is_default_shipping: data.setAsDefault,
        is_default_billing: data.setAsDefault,
      })

      onClose()
    } catch (error) {
      console.error(error)
    }
  }

  if (showDeleteModal) {
    return (
      <DeleteAddress
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          const result = await deleteCustomerAddress(address.id)

          if (!result.success) {
            console.error(result.error)
            return
          }

          setShowDeleteModal(false)
          onDeleted(address.id)
        }}
      />
    )
  }

  return (
    <Modal
      onClose={onClose}
      header={
        <div className="flex justify-center">
          <label className="sop-body-lg-medium text-sop-neutral-gray-200">
            แก้ไขข้อมูลการจัดส่ง
          </label>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Button
            onClick={() => setShowDeleteModal(true)}
            variant="filled"
            fill
            size="lg"
          >
            ลบที่อยู่
          </Button>

          <Button fill size="lg" onClick={handleSubmit(onSubmit)}>
            บันทึก
          </Button>
        </div>
      }
    >
      <div>
        <label className="sop-body-sm-medium text-sop-neutral-gray-300 mt-5 mb-2 flex items-center gap-1">
          การจัดส่ง
        </label>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:gap-5">
          <InputSOPet
            isRequire
            title="ที่อยู่"
            size="sm"
            variant="bordered"
            placeholder="บ้านเลขที่/ซอย/หมู่/ถนน"
            state={errors.address ? "error" : "default"}
            description={(errors.address as FieldError)?.message}
            {...register("address", {
              setValueAs: trimValue,
            })}
          />

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <AddressDropdown
              control={control}
              name="subDistrict"
              title="ตำบล/แขวง"
              placeholder="เลือกตำบล/แขวง"
              disabled={!provinceValue || !districtValue}
              options={subdistrictOptions}
              error={errors.subDistrict as FieldError}
              onSelect={(option) => {
                setValue("postalCode", option.postalCode || "")
              }}
            />

            <AddressDropdown
              control={control}
              name="district"
              title="เขต/อำเภอ"
              placeholder="เลือกเขต/อำเภอ"
              disabled={!provinceValue}
              options={districtOptions}
              error={errors.district as FieldError}
              onSelect={() => {
                resetFields(["subDistrict", "postalCode"])
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-6">
            <AddressDropdown
              control={control}
              name="province"
              title="จังหวัด"
              placeholder="เลือกจังหวัด"
              options={provinceOptions}
              error={errors.province as FieldError}
              onSelect={() => {
                resetFields(["district", "subDistrict", "postalCode"])
              }}
            />

            <InputSOPet
              isRequire
              title="รหัสไปรษณีย์"
              size="sm"
              variant="bordered"
              placeholder="กรอกรหัสไปรษณีย์"
              value={postalCodeValue}
              readOnly
              disabled
              state={errors.postalCode ? "error" : "default"}
              description={(errors.postalCode as FieldError)?.message}
            />
          </div>

          <InputSOPet
            isRequire
            title="ชื่อ-นามสกุล (ผู้รับสินค้า)"
            size="sm"
            variant="bordered"
            placeholder="ชื่อ / นามสกุล (ผู้รับสินค้า)"
            state={errors.recipientFullName ? "error" : "default"}
            description={(errors.recipientFullName as FieldError)?.message}
            {...register("recipientFullName", {
              setValueAs: trimValue,
            })}
          />

          <InputSOPet
            isRequire
            title="เบอร์โทรศัพท์ (ผู้รับสินค้า)"
            size="sm"
            variant="bordered"
            placeholder="099-999-9999"
            state={errors.phone ? "error" : "default"}
            description={(errors.phone as FieldError)?.message}
            {...register("phone", {
              setValueAs: trimValue,
              onChange: (e) => {
                const formatted = formatPhoneNumber(e.target.value)

                setValue("phone", formatted, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              },
            })}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Controller
            control={control}
            name="setAsDefault"
            render={({ field: { value, onChange, ...field } }) => (
              <Checkbox
                label="บันทึกไว้ใช้ครั้งถัดไป และตั้งเป็นค่าเริ่มต้น"
                checked={!!value}
                onChange={(e) =>
                  onChange((e.target as HTMLInputElement).checked)
                }
                {...field}
              />
            )}
          />
        </div>
      </div>
    </Modal>
  )
}

export default EditAddress

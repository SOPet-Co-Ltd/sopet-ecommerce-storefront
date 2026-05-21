"use client"

import { useMemo } from "react"
import { Controller, FieldError, Path, useFormContext } from "react-hook-form"

import { Checkbox, InputSOPet } from "@/components/atoms"
import { Infotag } from "@/components/atoms/InfoTag/Infotag"

import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
  trimValue,
} from "@/lib/data/thai-address-helpers"

import { AddressFormData } from "../../AddressForm/schema"
import AddressDropdown from "./AddressDropdown"

interface Props {
  onSubmitForm?: (data: AddressFormData) => Promise<void> | void
}

const AddressEmptyState = ({ onSubmitForm }: Props) => {
  return <AddressEmptyStateContent onSubmitForm={onSubmitForm} />
}

export default AddressEmptyState

const AddressEmptyStateContent = ({ onSubmitForm: _onSubmitForm }: Props) => {
  const {
    control,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<AddressFormData>()

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

  return (
    <div>
      <label className="sop-body-sm-medium text-sop-neutral-gray-300 mb-2 flex items-center gap-1">
        การติดต่อ
      </label>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-5">
        <InputSOPet
          isRequire
          title="เบอร์โทรศัพท์"
          size="sm"
          variant="bordered"
          placeholder="099-999-9999"
          state={errors.phone ? "error" : "default"}
          description={(errors.phone as FieldError)?.message}
          {...register("phone", {
            setValueAs: trimValue,
          })}
        />

        <div>
          <InputSOPet
            isRequire
            title="อีเมล"
            size="sm"
            variant="bordered"
            placeholder="example@email.com"
            state={errors.email ? "error" : "default"}
            description={(errors.email as FieldError)?.message}
            {...register("email", {
              setValueAs: trimValue,
            })}
          />

          <Infotag className="mt-3 w-full gap-2 rounded-sop-8px border border-sop-primary-300 bg-sop-primary-100 px-sop-12px py-sop-8px sop-body-xs-regular text-sop-primary-600">
            📩 กรอกอีเมล เพื่อรับอัปเดตจาก Sopet ก่อนใคร
          </Infotag>
        </div>
      </div>

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
      </div>

      <div className="mt-5.5 mb-sop-16px flex items-center gap-2">
        <Controller
          control={control}
          name="setAsDefault"
          render={({ field: { value, onChange, ...field } }) => (
            <Checkbox
              label="บันทึกไว้ใช้ครั้งถัดไป และตั้งเป็นค่าเริ่มต้น"
              checked={!!value}
              onChange={(e) =>
                onChange((e?.target as HTMLInputElement)?.checked)
              }
              {...field}
            />
          )}
        />
      </div>
    </div>
  )
}

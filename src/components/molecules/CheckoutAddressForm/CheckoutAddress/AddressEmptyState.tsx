"use client"

import { Controller, FieldError, useFormContext } from "react-hook-form"

import {
  Checkbox,
  Dropdown,
  DropdownItem,
  InputSOPet,
} from "@/components/atoms"

import { DownArrowIcon } from "@/icons"

import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
} from "@/lib/data/thai-address-helpers"

import { Infotag } from "@/components/atoms/InfoTag/Infotag"
import { AddressFormData } from "../../AddressForm/schema"

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

  const provinceOptions = getProvinces()
  const districtOptions = getDistricts(provinceValue)

  const subdistrictOptions = getSubdistrictsWithPostal(
    provinceValue,
    districtValue
  )

  return (
    <div>
      <label className="sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
        การติดต่อ
      </label>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 grid-cols-1 gap-3 lg:gap-5 mt-5">
        <InputSOPet
          isRequire
          title="เบอร์โทรศัพท์"
          size="sm"
          variant="bordered"
          placeholder="099-999-9999"
          state={errors.phone ? "error" : "default"}
          description={(errors.phone as FieldError)?.message}
          {...register("phone", {
            setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
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
              setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
            })}
          />

          <Infotag className="gap-2 rounded-sop-8px border border-sop-primary-300 bg-sop-primary-100 px-sop-12px py-sop-8px sop-body-xs-regular text-sop-primary-600 mt-3 w-full">
            📩 กรอกอีเมล เพื่อรับอัปเดตจาก Sopet ก่อนใคร
          </Infotag>
        </div>
      </div>

      <label className="sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2 size-sm mt-5">
        การจัดส่ง
      </label>

      <div className="grid grid-cols-1 gap-3 lg:gap-5 mt-5">
        <InputSOPet
          isRequire
          title="ที่อยู่"
          size="sm"
          variant="bordered"
          placeholder="บ้านเลขที่/ซอย/หมู่/ถนน"
          state={errors.address ? "error" : "default"}
          description={(errors.address as FieldError)?.message}
          {...register("address", {
            setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
          })}
        />

        <div className="grid grid-cols-2 md:gap-6 lg:gap-6 xl:gap-6 gap-3">
          <div>
            <Controller
              control={control}
              name="subDistrict"
              render={({ field }) => {
                const handleSubdistrictChange = (value: string) => {
                  const opt = subdistrictOptions.find((o) => o.value === value)

                  if (opt) {
                    field.onChange(opt.label)
                    setValue("postalCode", opt.postalCode)
                  }
                }

                const dropdownValue =
                  subdistrictOptions.find((o) => o.label === field.value)
                    ?.value ?? field.value

                return (
                  <Dropdown
                    title="ตำบล/แขวง"
                    isRequire
                    button={{
                      variant: "neutral",
                      size: "lg",
                      fill: true,
                      disabled: !provinceValue || !districtValue,
                    }}
                    triggerClassName="w-full"
                    placeholder="เลือกตำบล/แขวง"
                    value={dropdownValue}
                    onValueChange={handleSubdistrictChange}
                    icon={<DownArrowIcon size={12} color="#454547" />}
                  >
                    {subdistrictOptions.map((opt) => (
                      <DropdownItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                )
              }}
            />

            {errors.subDistrict && (
              <p className="sop-body-xs-regular text-sop-system-error-400 mt-1">
                {(errors.subDistrict as FieldError).message}
              </p>
            )}
          </div>

          <div>
            <Controller
              control={control}
              name="district"
              render={({ field }) => (
                <Dropdown
                  isRequire
                  title="เขต/อำเภอ"
                  button={{
                    variant: "neutral",
                    size: "lg",
                    fill: true,
                    disabled: !provinceValue,
                  }}
                  triggerClassName="w-full"
                  placeholder="เลือกเขต/อำเภอ"
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)

                    setValue("subDistrict", "")
                    setValue("postalCode", "")
                  }}
                  icon={<DownArrowIcon size={12} color="#454547" />}
                >
                  {districtOptions.map((opt) => (
                    <DropdownItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownItem>
                  ))}
                </Dropdown>
              )}
            />

            {errors.district && (
              <p className="sop-body-xs-regular text-sop-system-error-400 mt-1">
                {(errors.district as FieldError).message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:gap-6 lg:gap-6 xl:gap-6 gap-3">
          <div>
            <Controller
              control={control}
              name="province"
              render={({ field }) => (
                <Dropdown
                  isRequire
                  title="จังหวัด"
                  button={{
                    variant: "neutral",
                    size: "lg",
                    fill: true,
                  }}
                  triggerClassName="w-full"
                  placeholder="เลือกจังหวัด"
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)

                    setValue("district", "")
                    setValue("subDistrict", "")
                    setValue("postalCode", "")
                  }}
                  icon={<DownArrowIcon size={12} color="#454547" />}
                >
                  {provinceOptions.map((opt) => (
                    <DropdownItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </DropdownItem>
                  ))}
                </Dropdown>
              )}
            />

            {errors.province && (
              <p className="sop-body-xs-regular text-sop-system-error-400 mt-1">
                {(errors.province as FieldError).message}
              </p>
            )}
          </div>

          <div>
            <InputSOPet
              isRequire
              title="รหัสไปรษณีย์"
              size="sm"
              variant="bordered"
              placeholder="กรอกรหัสไปรษณีย์"
              value={watch("postalCode")}
              readOnly
              disabled
              state={errors.postalCode ? "error" : "default"}
              description={(errors.postalCode as FieldError)?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <InputSOPet
            isRequire
            title="ชื่อ-นามสกุล (ผู้รับสินค้า)"
            size="sm"
            variant="bordered"
            placeholder="ชื่อ / นามสกุล (ผู้รับสินค้า)"
            state={errors.recipientFullName ? "error" : "default"}
            description={(errors.recipientFullName as FieldError)?.message}
            {...register("recipientFullName", {
              setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
            })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-5.5 mb-sop-16px">
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

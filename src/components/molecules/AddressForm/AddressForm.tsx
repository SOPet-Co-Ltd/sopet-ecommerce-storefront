"use client"
import {
  Controller,
  FieldError,
  FieldValues,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addressSchema, AddressFormData } from "./schema"
import {
  Button,
  Checkbox,
  Dropdown,
  DropdownItem,
  InputSOPet,
} from "@/components/atoms"
import { DownArrowIcon } from "@/icons"
import { addCustomerAddress, updateCustomerAddress } from "@/lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useState, forwardRef, useImperativeHandle } from "react"
import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
} from "@/lib/data/thai-address-helpers"

export interface AddressFormHandle {
  submit: () => void
}

interface Props {
  mode?: "create" | "edit"
  defaultValues?: AddressFormData
  regions: HttpTypes.StoreRegion[]
  handleClose?: () => void
  submitButton?: (props: {
    onSubmit: () => void
    isSubmitting: boolean
  }) => React.ReactNode
}

export const emptyDefaultAddressValues: AddressFormData = {
  recipientFullName: "",
  phone: "",
  province: "",
  district: "",
  subDistrict: "",
  postalCode: "",
  address: "",
  setAsDefault: false,
}

export const AddressForm = forwardRef<AddressFormHandle, Props>(
  ({ defaultValues, mode, ...props }, ref) => {
    const methods = useForm<AddressFormData>({
      resolver: zodResolver(addressSchema),
      defaultValues: defaultValues || emptyDefaultAddressValues,
    })

    return (
      <FormProvider {...methods}>
        <Form mode={mode} {...props} ref={ref} />
      </FormProvider>
    )
  }
)

AddressForm.displayName = "AddressForm"

function splitRecipientName(fullName: string): {
  firstName: string
  lastName: string
} {
  const trimmed = fullName.trim()
  const spaceIndex = trimmed.indexOf(" ")
  if (spaceIndex === -1) return { firstName: trimmed, lastName: "" }
  return {
    firstName: trimmed.slice(0, spaceIndex),
    lastName: trimmed.slice(spaceIndex + 1).trim(),
  }
}

const Form = forwardRef<AddressFormHandle, Props>(
  ({ mode, regions, handleClose, submitButton }, ref) => {
    const [error, setError] = useState<string>()
    const {
      control,
      handleSubmit,
      register,
      setValue,
      watch,
      formState: { errors, isSubmitting },
    } = useFormContext<AddressFormData>()

    const provinceValue = watch("province")
    const districtValue = watch("district")

    const provinceOptions = getProvinces()
    const districtOptions = getDistricts(provinceValue)
    const subdistrictOptions = getSubdistrictsWithPostal(
      provinceValue,
      districtValue
    )

    const submit = async (data: FieldValues) => {
      const { firstName, lastName } = splitRecipientName(data.recipientFullName)
      const addressName = data.recipientFullName.trim() || "ที่อยู่"

      const formData = new FormData()
      formData.append("addressId", data.addressId || "")
      formData.append("address_name", addressName)
      formData.append("first_name", firstName)
      formData.append("last_name", lastName)
      formData.append("address_1", data.address)
      formData.append("address_2", data.district)
      formData.append("province", data.province)
      formData.append("city", data.subDistrict)
      formData.append("country_code", "th")
      formData.append("postal_code", data.postalCode)
      formData.append("company", "")
      formData.append("phone", data.phone)
      formData.append("isDefaultShipping", data.setAsDefault ? "1" : "")
      formData.append("isDefaultBilling", data.setAsDefault ? "1" : "")

      // Determine mode: use explicit mode prop if provided, otherwise fallback to addressId check
      const isEditMode =
        mode === "edit" || (mode !== "create" && data.addressId)

      const res = isEditMode
        ? await updateCustomerAddress(formData)
        : await addCustomerAddress(formData)

      if (!res.success) {
        setError(res.error)
        return
      }

      setError("")
      handleClose?.()
    }

    const onSubmit = handleSubmit(submit)

    useImperativeHandle(ref, () => ({
      submit: onSubmit,
    }))

    return (
      <form onSubmit={onSubmit}>
        <div className="space-y-4">
          <div className="max-w-full grid grid-cols-1 items-top gap-4 mb-4">
            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                ชื่อ-นามสกุล ผู้รับสินค้า
              </label>
              <InputSOPet
                size="sm"
                variant="bordered"
                placeholder="กรอกชื่อ-นามสกุล"
                state={errors.recipientFullName ? "error" : "default"}
                description={(errors.recipientFullName as FieldError)?.message}
                {...register("recipientFullName")}
              />
            </div>
            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                เบอร์โทรศัพท์
              </label>
              <InputSOPet
                size="sm"
                variant="bordered"
                placeholder="กรอกเบอร์โทรศัพท์"
                state={errors.phone ? "error" : "default"}
                description={(errors.phone as FieldError)?.message}
                {...register("phone")}
              />
            </div>

            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                จังหวัด
              </label>
              <Controller
                control={control}
                name="province"
                render={({ field }) => (
                  <Dropdown
                    button={{ variant: "neutral", size: "lg", fill: true }}
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
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                เขต/อำเภอ
              </label>
              <Controller
                control={control}
                name="district"
                render={({ field }) => (
                  <Dropdown
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

            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                แขวง/ตำบล
              </label>
              <Controller
                control={control}
                name="subDistrict"
                render={({ field }) => {
                  const handleSubdistrictChange = (value: string) => {
                    const opt = subdistrictOptions.find(
                      (o) => o.value === value
                    )
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
                      button={{
                        variant: "neutral",
                        size: "lg",
                        fill: true,
                        disabled: !provinceValue || !districtValue,
                      }}
                      triggerClassName="w-full"
                      placeholder="เลือกแขวง/ตำบล"
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
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                รหัสไปรษณีย์
              </label>
              <InputSOPet
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

            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                ที่อยู่
              </label>
              <InputSOPet
                size="sm"
                variant="bordered"
                placeholder="กรอกที่อยู่"
                state={errors.address ? "error" : "default"}
                description={(errors.address as FieldError)?.message}
                {...register("address")}
              />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="setAsDefault"
                render={({ field: { value, onChange, ...field } }) => (
                  <Checkbox
                    label="ตั้งเป็นค่าเริ่มต้น"
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
          {error && <p className="label-md text-negative">{error}</p>}
          {submitButton ? (
            submitButton({ onSubmit, isSubmitting })
          ) : (
            <div className="flex justify-center">
              <Button rounded="rounded" disabled={isSubmitting}>
                {isSubmitting ? "กำลังบันทึก..." : "ยืนยัน"}
              </Button>
            </div>
          )}
        </div>
      </form>
    )
  }
)

Form.displayName = "Form"

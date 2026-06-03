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
import { Button, Checkbox, InputSOPet } from "@/components/atoms"
import { SearchableSelectField } from "@/components/molecules/SearchableSelect/SearchableSelectField"
import { addCustomerAddress, updateCustomerAddress } from "@/lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import { useState, forwardRef, useImperativeHandle } from "react"
import { ThaiPhoneInput } from "@/components/molecules/ThaiPhoneInput/ThaiPhoneInput"
import {
  getDistricts,
  getProvinces,
  getSubdistrictsWithPostal,
} from "@/lib/data/thai-address-helpers"
import { normalizeThaiPhoneNumber } from "@/lib/helpers/phone"

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
    isDirty: boolean
    hasAnyValue: boolean
  }) => React.ReactNode
}

export const emptyDefaultAddressValues: AddressFormData = {
  recipientFullName: "",
  contactPhone: "",
  phone: "",
  province: "",
  district: "",
  subDistrict: "",
  postalCode: "",
  address: "",
  setAsDefault: false,
  // recipientphone: "",
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
      formState: { errors, isSubmitting, isDirty },
    } = useFormContext<AddressFormData>()

    const provinceValue = watch("province")
    const districtValue = watch("district")
    const phoneValue = watch("phone")
    const allValues = watch()

    const hasAnyValue = Object.values(allValues).some((v) => {
      if (typeof v === "string") return v.trim().length > 0
      return Boolean(v)
    })

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
      formData.append("phone", normalizeThaiPhoneNumber(data.phone))
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
                {...register("recipientFullName", {
                  // Prevent whitespace-only values like " " from passing validation
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
              />
            </div>
            <div>
              <label className="sop-body-sm-medium md:sop-body-sm-medium text-sop-neutral-gray-300 flex items-center gap-1 mb-2">
                เบอร์โทรศัพท์
              </label>
              <ThaiPhoneInput
                size="sm"
                variant="bordered"
                placeholder="กรอกเบอร์โทรศัพท์"
                state={errors.phone ? "error" : "default"}
                description={(errors.phone as FieldError)?.message}
                value={phoneValue}
                onValueChange={(value) =>
                  setValue("phone", value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </div>

            <SearchableSelectField
              control={control}
              name="province"
              title="จังหวัด"
              placeholder="เลือกจังหวัด"
              options={provinceOptions}
              error={errors.province as FieldError}
              onSelect={() => {
                setValue("district", "")
                setValue("subDistrict", "")
                setValue("postalCode", "")
              }}
            />

            <SearchableSelectField
              control={control}
              name="district"
              title="เขต/อำเภอ"
              placeholder="เลือกเขต/อำเภอ"
              options={districtOptions}
              disabled={!provinceValue}
              error={errors.district as FieldError}
              onSelect={() => {
                setValue("subDistrict", "")
                setValue("postalCode", "")
              }}
            />

            <SearchableSelectField
              control={control}
              name="subDistrict"
              title="แขวง/ตำบล"
              placeholder="เลือกแขวง/ตำบล"
              options={subdistrictOptions}
              disabled={!provinceValue || !districtValue}
              error={errors.subDistrict as FieldError}
              storeFieldValue="label"
              onSelect={(option) => {
                setValue("postalCode", String(option.postalCode ?? ""))
              }}
            />

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
                {...register("address", {
                  // Prevent whitespace-only values like " " from passing validation
                  setValueAs: (v) => (typeof v === "string" ? v.trim() : v),
                })}
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
            submitButton({ onSubmit, isSubmitting, isDirty, hasAnyValue })
          ) : (
            <div className="flex justify-center">
              <Button rounded="rounded" disabled={isSubmitting} type="submit">
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

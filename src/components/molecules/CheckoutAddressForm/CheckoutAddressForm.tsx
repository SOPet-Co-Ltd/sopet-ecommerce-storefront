"use client"

import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin } from "lucide-react"

import { AddressFormData, addressSchema } from "../AddressForm/schema"
import AddressEmptyState from "./CheckoutAddress/AddressEmptyState"
import AddressFilledState from "./CheckoutAddress/AddressFilledState"
import { StoreCustomer } from "@medusajs/types"

interface Props {
  customer?: StoreCustomer | null
  defaultValues?: AddressFormData
  onSubmitForm?: (data: AddressFormData) => Promise<void> | void
}

export const emptyDefaultAddressValues: AddressFormData = {
  recipientFullName: "",
  phone: "",
  email: "",
  province: "",
  district: "",
  subDistrict: "",
  postalCode: "",
  address: "",
  setAsDefault: false,
}

const CheckoutAddressForm = ({
  customer,
  defaultValues,
  onSubmitForm,
}: Props) => {
  const methods = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: defaultValues || emptyDefaultAddressValues,
  })

  return (
    <FormProvider {...methods}>
      <CheckoutAddressFormContent
        customer={customer}
        onSubmitForm={onSubmitForm}
      />
    </FormProvider>
  )
}

export default CheckoutAddressForm

const CheckoutAddressFormContent = ({ customer, onSubmitForm }: Props) => {
  const { handleSubmit } = useFormContext<AddressFormData>()

  const onSubmit = handleSubmit(async (data) => {
    await onSubmitForm?.(data)
  })
  return (
    <form>
      <div className="mt-6">
        <label className="sop-body-lg-medium text-sop-primary-500 flex items-center gap-1 mb-3 mt-5">
          <MapPin className="fill-sop-primary-500 text-white" size={24} />
          ข้อมูลการจัดส่ง
        </label>
        <div className="relative overflow-hidden  md:w-203.75 xl:w-203.75 lg:w-203.75 w-85.75 bg-sop-base-white rounded-sop-20 md:px-6 xl:px-6 lg:px-6 px-4 py-6 ">
          {!customer?.addresses.length ? (
            <AddressEmptyState onSubmitForm={onSubmitForm} />
          ) : (
            <AddressFilledState customer={customer} />
          )}
          <div
            className="
    absolute bottom-0 left-0 right-0
    h-0.75
    rounded-b-sop-20
    bg-[repeating-linear-gradient(to_right,#9C6ADE_0px,#9C6ADE_36.31px,transparent_36.31px,transparent_48.31px,#FF6F61_48.31px,#FF6F61_84.62px,transparent_84.62px,transparent_96.62px)]
  "
          />
        </div>
      </div>
    </form>
  )
}

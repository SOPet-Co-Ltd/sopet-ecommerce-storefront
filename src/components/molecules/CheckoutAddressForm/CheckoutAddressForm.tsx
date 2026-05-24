"use client"

import { useEffect } from "react"
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MapPin } from "lucide-react"

import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import { AddressFormData, checkoutAddressSchema } from "../AddressForm/schema"
import AddressEmptyState from "./CheckoutAddress/AddressEmptyState"
import AddressFilledState from "./CheckoutAddress/AddressFilledState"
import { customerAddressToFormValues } from "./customerAddressToFormValues"
import { StoreCustomer } from "@medusajs/types"

interface Props {
  customer?: StoreCustomer | null
  defaultValues?: AddressFormData
  onSubmitForm?: (data: AddressFormData) => Promise<void> | void
}

export const emptyDefaultAddressValues: AddressFormData = {
  recipientFullName: "",
  contactPhone: "",
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
  const defaultAddress = customer?.addresses?.find((a) => a.is_default_shipping)
  const seedValues =
    defaultValues ??
    (defaultAddress
      ? customerAddressToFormValues(defaultAddress, customer ?? null)
      : emptyDefaultAddressValues)

  const methods = useForm<AddressFormData>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: seedValues,
  })

  return (
    <FormProvider {...methods}>
      <CheckoutAddressStoreSync customer={customer ?? null} />
      <CheckoutAddressFormContent
        customer={customer}
        onSubmitForm={onSubmitForm}
      />
    </FormProvider>
  )
}

export default CheckoutAddressForm

function CheckoutAddressStoreSync({
  customer,
}: {
  customer: StoreCustomer | null
}) {
  const setShippingAddress = useCheckoutStore(
    (state) => state.setShippingAddress
  )
  const setAddressFormTrigger = useCheckoutStore(
    (state) => state.setAddressFormTrigger
  )
  const { trigger } = useFormContext<AddressFormData>()
  const values = useWatch<AddressFormData>()

  useEffect(() => {
    setAddressFormTrigger(trigger)
    return () => setAddressFormTrigger(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAddressFormTrigger])

  useEffect(() => {
    const parsed = checkoutAddressSchema.safeParse(values)
    if (parsed.success) {
      setShippingAddress(parsed.data)
    }
  }, [values, setShippingAddress])

  // Seed once from the customer's default shipping on mount when form is empty.
  useEffect(() => {
    const defaultAddress = customer?.addresses?.find(
      (a) => a.is_default_shipping
    )
    if (!defaultAddress) return
    const seeded = customerAddressToFormValues(defaultAddress, customer)
    const parsed = checkoutAddressSchema.safeParse(seeded)
    if (parsed.success) {
      setShippingAddress(parsed.data)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id])

  return null
}

const CheckoutAddressFormContent = ({ customer, onSubmitForm }: Props) => {
  return (
    <form>
      <div className="mt-6 mb-sop-20px">
        <label className="sop-body-lg-medium text-sop-primary-500 flex items-center gap-2 mb-3 mt-5">
          <MapPin className="fill-sop-primary-500 text-white" size={24} />
          ข้อมูลการจัดส่ง
        </label>
        <div className="relative overflow-hidden w-fill bg-sop-base-white rounded-sop-20 md:px-6 xl:px-6 lg:px-6 px-4 py-6 ">
          {!customer?.addresses.length ? (
            <AddressEmptyState
              onSubmitForm={onSubmitForm}
              storeCustomer={customer}
            />
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

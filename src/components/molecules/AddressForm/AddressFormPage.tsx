"use client"

import { useParams, useRouter } from "next/navigation"
import { AddressForm, emptyDefaultAddressValues } from "./AddressForm"
import type { AddressFormData } from "./schema"
import type { HttpTypes } from "@medusajs/types"

type AddressFormPageProps = {
  regions: HttpTypes.StoreRegion[]
  defaultValues?: AddressFormData | null
}

export function AddressFormPage({
  regions,
  defaultValues,
}: AddressFormPageProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params?.locale as string) ?? ""

  const handleClose = () => {
    router.push(`/${locale}/user/addresses`)
  }

  return (
    <AddressForm
      mode="create"
      regions={regions}
      defaultValues={defaultValues ?? emptyDefaultAddressValues}
      handleClose={handleClose}
    />
  )
}

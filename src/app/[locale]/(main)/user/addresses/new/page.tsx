import { AddressFormPage } from "@/components/molecules/AddressForm/AddressFormPage"
import { UserContainer } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { listRegions } from "@/lib/data/regions"
import { redirect } from "next/navigation"

export default async function NewAddressPage() {
  const user = await verifyCustomer()
  const regions = await listRegions()

  if (!user) {
    redirect("/user")
  }

  return (
    <UserContainer title="ที่อยู่สำหรับจัดส่ง" showBackButton>
      <AddressFormPage regions={regions} />
    </UserContainer>
  )
}

import { UserContainer, UserNavigation } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"
import { Addresses } from "@/components/organisms"
import { listRegions } from "@/lib/data/regions"

export default async function Page() {
  const user = await verifyCustomer()
  const regions = await listRegions()

  if (!user) {
    redirect("/user")
  }

  return (
    <UserContainer title="ที่อยู่สำหรับจัดส่ง">
      <Addresses {...{ user, regions }} />
    </UserContainer>
  )
}

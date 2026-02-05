import { ProfileContactOtpForm, UserContainer } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"

export default async function AddEmailPage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เพิ่มอีเมล" showBackButton>
      <ProfileContactOtpForm
        type="email"
        mode="add"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

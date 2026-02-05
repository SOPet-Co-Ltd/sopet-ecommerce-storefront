import { ProfileContactOtpForm, UserContainer } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"

export default async function AddPhonePage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เพิ่มเบอร์โทรศัพท์" showBackButton>
      <ProfileContactOtpForm
        type="phone"
        mode="add"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

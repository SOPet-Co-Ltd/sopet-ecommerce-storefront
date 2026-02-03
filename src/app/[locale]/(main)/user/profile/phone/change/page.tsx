import { ProfileContactOtpForm, UserContainer } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"

export default async function ChangePhonePage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เปลี่ยนเบอร์โทรศัพท์" showBackButton>
      <ProfileContactOtpForm
        type="phone"
        mode="change"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

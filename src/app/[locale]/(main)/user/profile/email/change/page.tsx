import { ProfileContactOtpForm, UserContainer } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"

export default async function ChangeEmailPage() {
  const customer = await verifyCustomer()
  return (
    <UserContainer title="เปลี่ยนอีเมล" showBackButton>
      <ProfileContactOtpForm
        type="email"
        mode="change"
        currentEmail={customer?.email ?? null}
        currentPhone={customer?.phone ?? null}
      />
    </UserContainer>
  )
}

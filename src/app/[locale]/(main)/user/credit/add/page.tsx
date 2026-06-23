import { UserContainer } from "@/components/molecules/UserContainer/UserContainer"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { CreditCardFormPage } from "@/components/molecules/CreditCardForm/CreditCardFormPage"
import { verifyCustomer } from "@/lib/data/customer"

export default async function AddCreditCardPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  return (
    <UserContainer title="เพิ่มบัตรเครดิต/เดบิต" showBackButton>
      <CreditCardFormPage customer={user} />
    </UserContainer>
  )
}

import { UserContainer } from "@/components/molecules"
import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { getCustomerPaymentMethods, verifyCustomer } from "@/lib/data/customer"
import { CreditCards } from "@/components/organisms"

export default async function CreditPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  const result = await getCustomerPaymentMethods()

  const paymentMethods = result.success ? result.paymentMethods : []

  return (
    <UserContainer title="บัตรเครดิต/เดบิต">
      <CreditCards paymentMethods={paymentMethods} />
    </UserContainer>
  )
}

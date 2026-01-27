import { RegisterForm } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

export default async function RegisterPage() {
  const user = await verifyCustomer()

  if (user) {
    redirect("/user")
  }

  return <RegisterForm />
}

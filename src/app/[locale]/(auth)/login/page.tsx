import { LoginForm } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const user = await verifyCustomer()

  if (user) {
    redirect("/user")
  }

  return <LoginForm />
}

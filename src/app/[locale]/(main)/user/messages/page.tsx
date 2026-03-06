import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { UserMessagesSection } from "@/components/sections/UserMessagesSection/UserMessagesSection"
import { verifyCustomer } from "@/lib/data/customer"

export default async function MessagesPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container px-sop-16px">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 space-y-8">
          <UserMessagesSection />
        </div>
      </div>
    </main>
  )
}

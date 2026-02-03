import {
  LoginForm,
  ProfileDetailsSection,
  UserContainer,
} from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"

export default async function UserProfilePage() {
  const user = await verifyCustomer()

  if (!user) {
    return <LoginForm />
  }

  return (
    <UserContainer title="ข้อมูลส่วนตัว">
      <ProfileDetailsSection user={user} />
    </UserContainer>
  )
}

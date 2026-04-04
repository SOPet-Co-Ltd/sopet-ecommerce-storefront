import {
  LoginForm,
  ProfileDetailsSection,
  UserContainer,
} from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/profile",
    title: "ข้อมูลส่วนตัว",
    description: "จัดการชื่อ ข้อมูลติดต่อ และรายละเอียดบัญชีของคุณ",
    indexable: false,
  })
}

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

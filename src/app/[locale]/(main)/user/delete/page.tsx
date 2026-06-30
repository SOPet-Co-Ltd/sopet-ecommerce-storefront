import { DeleteAccountButton } from "@/components/molecules/DeleteAccountButton/DeleteAccountButton"
import { UserContainer } from "@/components/molecules/UserContainer/UserContainer"
import { verifyCustomer } from "@/lib/data/customer"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import { formatSoftDeleteRetentionPeriodThai } from "@/lib/helpers/customer-deletion"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/delete",
    title: "ลบบัญชี",
    description: "ขอลบบัญชีและข้อมูลส่วนบุคคลของคุณจากระบบ Sopet",
    indexable: false,
  })
}

export default async function DeleteAccountPage() {
  const customer = await verifyCustomer()
  const retentionPeriod = formatSoftDeleteRetentionPeriodThai()

  if (!customer) {
    redirect("/login")
  }

  return (
    <UserContainer title="คำขอลบบัญชี">
      <div
        className={cn(
          "flex flex-col items-center gap-sop-24px py-sop-40px text-center"
        )}
      >
        <h2 className="sop-headline-md-medium text-sop-neutral-gray-200">
          ยื่นคำขอลบบัญชีผู้ใช้งาน
        </h2>
        <p className={cn("sop-body-md-regular text-sop-neutral-gray-200")}>
          คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีของคุณ หากคุณลบบัญชีแล้ว
          คุณสามารถเปิดใช้งานบัญชีอีกครั้งได้ภายใน {retentionPeriod}
          โดยเข้าสู่ระบบใหม่
        </p>
        <p
          className={cn(
            "sop-body-sm-regular text-sop-neutral-gray-300 max-w-[480px]"
          )}
        >
          หลังจาก {retentionPeriod} บัญชีจะถูกปิดใช้งานถาวรและไม่สามารถกู้คืนได้
        </p>
        <DeleteAccountButton />
      </div>
    </UserContainer>
  )
}

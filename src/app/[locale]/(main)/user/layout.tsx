import { UserBreadcrumbs } from "@/components/molecules/UserBreadcrumbs/UserBreadcrumbs"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { verifyCustomer } from "@/lib/data/customer"
import { cn } from "@/lib/utils"
import { redirect } from "next/navigation"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await verifyCustomer()

  if (!customer) {
    redirect("/login")
  }
  return (
    <div className={cn("md:px-sop-80px md:py-7.5 px-0 py-sop-20px")}>
      <div className={cn("mb-sop-40px lg:block hidden")}>
        <UserBreadcrumbs />
      </div>
      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-8")}>
        <aside className="lg:col-span-1 px-sop-16px">
          <UserNavigation user={customer} />
        </aside>
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  )
}

import { UserBreadcrumbs, UserNavigation } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { cn } from "@/lib/utils"

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const customer = await verifyCustomer()
  return (
    <div className={cn("md:px-sop-80px md:py-[30px] px-sop-16px py-sop-20px")}>
      <div className={cn("mb-sop-40px lg:block hidden")}>
        <UserBreadcrumbs />
      </div>
      <div className={cn("grid grid-cols-1 lg:grid-cols-4 gap-5 lg:gap-8")}>
        <aside className="lg:col-span-1">
          <UserNavigation user={customer} />
        </aside>
        <main className="lg:col-span-3">{children}</main>
      </div>
    </div>
  )
}

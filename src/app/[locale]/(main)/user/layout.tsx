import { UserBreadcrumbs, UserNavigation } from "@/components/molecules"
import { cn } from "@/lib/utils"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn("md:px-sop-80px md:py-[30px] px-sop-16px py-sop-20px")}>
      <div className={cn("mb-sop-40px md:block hidden")}>
        <UserBreadcrumbs />
      </div>
      <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-8")}>
        <aside className="md:col-span-1">
          <UserNavigation />
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  )
}

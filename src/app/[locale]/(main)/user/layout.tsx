import { UserBreadcrumbs, UserNavigation } from "@/components/molecules"
import { cn } from "@/lib/utils"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={cn("px-sop-80px py-[30px]")}>
      <div className={cn("mb-sop-40px")}>
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

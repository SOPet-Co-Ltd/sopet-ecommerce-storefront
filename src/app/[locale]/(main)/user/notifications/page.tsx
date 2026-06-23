import { Suspense } from "react"

import NotificationsPageClient from "@/app/[locale]/(main)/user/notifications/NotificationsPageClient"
import { getNotificationsPageBundleData } from "@/lib/data/notifications-page"

export const dynamic = "force-dynamic"

function NotificationsPageFallback() {
  return (
    <div className="lg:bg-sop-base-white rounded-lg w-full h-full animate-pulse">
      <div className="p-4 border-b border-sop-neutral-grayalpha-300 md:block hidden">
        <div className="h-6 w-32 bg-sop-neutral-grayalpha-300 rounded" />
      </div>
      <div className="p-2 md:p-4 flex gap-2">
        <div className="h-sop-32px w-24 bg-sop-neutral-grayalpha-300 rounded-[8px]" />
        <div className="h-sop-32px w-24 bg-sop-neutral-grayalpha-300 rounded-[8px]" />
      </div>
    </div>
  )
}

export default async function NotificationsPage() {
  const initialData = await getNotificationsPageBundleData()

  return (
    <Suspense fallback={<NotificationsPageFallback />}>
      <NotificationsPageClient initialData={initialData} />
    </Suspense>
  )
}

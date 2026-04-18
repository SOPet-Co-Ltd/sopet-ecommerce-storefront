import NotificationsPageClient from "@/app/[locale]/(main)/user/notifications/NotificationsPageClient"
import { getNotificationsPageBundleData } from "@/lib/data/notifications-page"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const initialData = await getNotificationsPageBundleData()

  return <NotificationsPageClient initialData={initialData} />
}

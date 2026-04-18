import { CouponsPageClient } from "@/components/sections/CouponsPage/CouponsPageClient"
import { getCouponsPageBundleData } from "@/lib/data/coupons-page"

export default async function CouponsPage() {
  const initialData = await getCouponsPageBundleData()

  return <CouponsPageClient initialData={initialData} />
}

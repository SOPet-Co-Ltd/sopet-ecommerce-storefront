import { LoginForm, UserNavigation } from "@/components/molecules"
import { ReviewsToWrite } from "@/components/organisms"
import { verifyCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"
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
    pathname: "user/reviews",
    title: "รีวิวที่ต้องเขียน",
    description: "ให้คะแนนและรีวิวสินค้าหลังได้รับคำสั่งซื้อ",
    indexable: false,
  })
}

export default async function Page() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  const orders = await listOrders()

  if (!orders) return null

  return (
    <main className="container px-sop-16px">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <ReviewsToWrite
          orders={
            orders.filter((order) => (order.reviews ?? []).length === 0) as any
          }
        />
      </div>
    </main>
  )
}

import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { OrderReturnRequests } from "@/components/sections/OrderReturnRequests/OrderReturnRequests"
import { verifyCustomer } from "@/lib/data/customer"
import { getReturns, retrieveReturnReasons } from "@/lib/data/orders"

import { buildPageMetadata } from "@/lib/metadata/build-page-metadata"
import type { Metadata } from "next"

type ReturnRequestLike = {
  line_items: { created_at: string }[]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathname: "user/returns",
    title: "คำขอคืนสินค้า",
    description: "ติดตามสถานะคำขอคืนสินค้าและคืนเงินของคุณ",
    indexable: false,
  })
}

export default async function ReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page: string; return: string }>
}) {
  const { order_return_requests } = await getReturns()
  const returnReasons = await retrieveReturnReasons()

  const user = await verifyCustomer()

  const { page, return: returnId } = await searchParams

  return (
    <main className="container px-sop-16px">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3">
          <h1 className="heading-md uppercase">Returns</h1>
          <OrderReturnRequests
            returns={[...(order_return_requests as ReturnRequestLike[])].sort(
              (a, b) => {
                return (
                  new Date(b.line_items[0].created_at).getTime() -
                  new Date(a.line_items[0].created_at).getTime()
                )
              }
            )}
            user={user}
            page={page}
            currentReturn={returnId || ""}
            returnReasons={returnReasons}
          />
        </div>
      </div>
    </main>
  )
}

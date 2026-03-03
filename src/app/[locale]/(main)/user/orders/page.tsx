import OrderListSection from "@/components/sections/OrderListSection/OrderListSection"
import { listOrders, verifyOrdersCustomer } from "@/lib/data/orders"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function UserPage() {
  const orders = await listOrders(100, 0)

  console.log({ orders })

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="lg:flex hidden flex-col gap-2">
        <h1 className="sop-headline-md-medium">คำสั่งซื้อสินค้า</h1>
      </div>

      <OrderListSection orders={orders} />
    </div>
  )
}

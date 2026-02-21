import { LoginForm } from "@/components/molecules"
import { OrderListSection } from "@/components/sections"
import { verifyCustomer } from "@/lib/data/customer"
import { listOrders } from "@/lib/data/orders"

export const dynamic = "force-dynamic"

export default async function UserPage() {
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  const orders = await listOrders(100, 0) // Fetch more orders for client-side filtering initially

  const flatOrders = orders.reduce((acc: any[], order: any) => {
    return acc.concat(order)
  }, [])

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium text-[#454547]">
          คำสั่งซื้อสินค้า
        </h1>
      </div>

      <OrderListSection orders={orders} />
    </div>
  )
}

import { OrderReturnSection } from "@/components/sections/OrderReturnSection/OrderReturnSection"
import {
  retrieveOrder,
  retrieveReturnReasons,
  retriveReturnMethods,
} from "@/lib/data/orders"
import { notFound } from "next/navigation"

export default async function ReturnOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const returnReasons = await retrieveReturnReasons()
  const returnMethods = await retriveReturnMethods(id)

  return (
    <main className="container">
      <OrderReturnSection
        order={order}
        returnReasons={returnReasons}
        shippingMethods={returnMethods}
      />
    </main>
  )
}

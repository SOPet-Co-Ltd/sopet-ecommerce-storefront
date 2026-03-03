import { retrieveOrder } from "@/lib/data/orders"
import OrderDetailsTemplate from "@/components/templates/OrderDetailsTemplate/OrderDetailsTemplate"
import { notFound } from "next/navigation"

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const order = await retrieveOrder(id).catch(() => null)

  if (!order) {
    return notFound()
  }

  return <OrderDetailsTemplate order={order} />
}

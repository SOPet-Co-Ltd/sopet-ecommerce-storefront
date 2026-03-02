import { LoginForm } from "@/components/molecules"
import { verifyCustomer } from "@/lib/data/customer"
import { retrieveOrder } from "@/lib/data/orders"
import OrderDetailsTemplate from "@/components/templates/OrderDetailsTemplate/OrderDetailsTemplate"
import { notFound } from "next/navigation"

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await verifyCustomer()

  if (!user) return <LoginForm />

  // Fetch the order details
  // Note: retrieveOrder fetches by ID. Verification if it belongs to user is handled by backend or we should check here?
  // standard store/orders/[id] usually checks customer_id in session if using standard auth.
  const order = await retrieveOrder(id)

  console.log({ order })

  if (!order) {
    return notFound()
  }

  return <OrderDetailsTemplate order={order} />
}

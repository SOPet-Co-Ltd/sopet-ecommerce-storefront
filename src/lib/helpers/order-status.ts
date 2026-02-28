import { HttpTypes } from "@medusajs/types"

export type OrderDisplayStatus =
  | "to-pay"
  | "preparing"
  | "to-receive"
  | "completed"
  | "cancelled"
  | "unknown"

export const getOrderDisplayStatus = (order: any): OrderDisplayStatus => {
  const status = order.status
  const fulfillment_status = order.fulfillment_status

  // Determine actual payment status, considering metadata mock capture
  const isPaid =
    order.payment_status === "captured" || order.metadata?.is_paid === true
  const payment_status = isPaid ? "captured" : order.payment_status

  // 1. Check Canceled or Refunded/Returned
  if (
    status === "canceled" ||
    payment_status === "canceled" ||
    fulfillment_status === "canceled"
  ) {
    return "cancelled"
  }
  if (fulfillment_status === "returned") {
    return "cancelled"
  }

  // 2. Check Completed
  if (status === "completed" || fulfillment_status === "delivered") {
    return "completed"
  }

  // 3. Check To Pay
  if (
    payment_status === "not_paid" ||
    payment_status === "awaiting" ||
    !isPaid
  ) {
    return "to-pay"
  }

  // 4. Paid / Captured Scenarios
  if (payment_status === "captured") {
    if (
      fulfillment_status === "not_fulfilled" ||
      fulfillment_status === "fulfilled" ||
      fulfillment_status === "partially_fulfilled"
    ) {
      return "preparing"
    }

    if (
      fulfillment_status === "shipped" ||
      fulfillment_status === "partially_shipped"
    ) {
      return "to-receive"
    }
  }

  return "unknown"
}

export const getOrderStatusLabel = (status: OrderDisplayStatus): string => {
  switch (status) {
    case "to-pay":
      return "ที่ต้องชำระ"
    case "preparing":
      return "เตรียมการจัดส่ง"
    case "to-receive":
      return "ที่ต้องได้รับ"
    case "completed":
      return "สำเร็จ"
    case "cancelled":
      return "ยกเลิก/คืนสินค้า"
    default:
      return "ไม่ทราบสถานะ"
  }
}

export const getOrderStatusColor = (status: OrderDisplayStatus): string => {
  switch (status) {
    default:
      return "text-sop-additionalblue-500"
  }
}

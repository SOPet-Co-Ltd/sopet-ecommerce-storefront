import { HttpTypes } from "@medusajs/types"

export type OrderDisplayStatus =
  | "to-pay"
  | "preparing"
  | "to-receive"
  | "completed"
  | "cancelled"
  | "unknown"

export const getOrderDisplayStatus = (order: any): OrderDisplayStatus => {
  if (order.status === "canceled") {
    return "cancelled"
  }

  if (
    order.status === "completed" ||
    order.fulfillment_status === "delivered"
  ) {
    return "completed"
  }

  const isPaid =
    order.payment_status !== "not_paid" || order.metadata?.is_paid === true

  if (!isPaid) {
    return "to-pay"
  }

  if (
    order.fulfillment_status === "shipped" ||
    order.fulfillment_status === "partially_shipped"
  ) {
    return "to-receive"
  }

  // Fallback for preparing
  if (
    order.fulfillment_status === "not_fulfilled" ||
    order.fulfillment_status === "partially_fulfilled"
  ) {
    return "preparing"
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

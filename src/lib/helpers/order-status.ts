// Type definitions matching backend API response
type OrderStatus = "pending" | "completed" | "canceled"

type PaymentStatus =
  | "not_paid"
  | "awaiting"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"

type FulfillmentStatus =
  | "not_fulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "partially_shipped"
  | "shipped"
  | "partially_delivered"
  | "delivered"
  | "canceled"

interface OrderWithStatus {
  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  metadata?: {
    is_paid?: boolean
    [key: string]: unknown
  }
}

export type OrderDisplayStatus =
  | "to-pay"
  | "preparing"
  | "to-receive"
  | "completed"
  | "cancelled"
  | "unknown"

/**
 * Maps backend order status to customer-facing display status
 * Priority order: Cancelled → Refunded → Completed → To Pay → Preparing → To Receive
 */
export const getOrderDisplayStatus = (
  order: OrderWithStatus
): OrderDisplayStatus => {
  const { status, payment_status, fulfillment_status, metadata } = order

  // Handle legacy metadata flag for mock payments
  const effectivePaymentStatus =
    metadata?.is_paid === true ? "captured" : payment_status

  // Priority 1: Cancelled orders
  if (
    status === "canceled" ||
    effectivePaymentStatus === "canceled" ||
    fulfillment_status === "canceled"
  ) {
    return "cancelled"
  }

  // Priority 2: Refunded orders
  if (
    effectivePaymentStatus === "refunded" ||
    effectivePaymentStatus === "partially_refunded"
  ) {
    return "cancelled"
  }

  // Priority 3: Completed orders (must have both completed status AND delivered)
  if (status === "completed" && fulfillment_status === "delivered") {
    return "completed"
  }

  // Priority 4: Unpaid orders (awaiting payment)
  if (
    effectivePaymentStatus === "not_paid" ||
    effectivePaymentStatus === "awaiting" ||
    effectivePaymentStatus === "authorized"
  ) {
    return "to-pay"
  }

  // Priority 5: Paid orders - determine by fulfillment stage
  if (effectivePaymentStatus === "captured") {
    // Delivered (but order status not yet marked complete)
    if (
      fulfillment_status === "delivered" ||
      fulfillment_status === "partially_delivered"
    ) {
      return "completed"
    }

    // Shipped/In Transit
    if (
      fulfillment_status === "shipped" ||
      fulfillment_status === "partially_shipped"
    ) {
      return "to-receive"
    }

    // Being prepared (not shipped yet)
    if (
      fulfillment_status === "not_fulfilled" ||
      fulfillment_status === "fulfilled" ||
      fulfillment_status === "partially_fulfilled"
    ) {
      return "preparing"
    }
  }

  // Fallback for unexpected states
  return "unknown"
}

export const getOrderStatusLabel = (status: OrderDisplayStatus): string => {
  const displayStatus: Record<OrderDisplayStatus, string> = {
    "to-pay": "ที่ต้องชำระ",
    preparing: "เตรียมการจัดส่ง",
    "to-receive": "ที่ต้องได้รับ",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก/คืนสินค้า",
    unknown: "ไม่ทราบสถานะ",
  }

  return displayStatus[status] || "ไม่ทราบสถานะ"
}

export const getOrderStatusColor = (status: OrderDisplayStatus): string => {
  switch (status) {
    default:
      return "text-sop-additionalblue-500"
  }
}

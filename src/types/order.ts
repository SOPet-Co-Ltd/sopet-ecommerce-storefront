export type OrderStatus = "pending" | "completed" | "canceled"

export type PaymentStatus =
  | "not_paid"
  | "awaiting"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"

export type FulfillmentStatus =
  | "not_fulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "partially_shipped"
  | "shipped"
  | "partially_delivered"
  | "delivered"
  | "canceled"

export type OrderDisplayStatus =
  | "to-pay"
  | "preparing"
  | "to-receive"
  | "completed"
  | "cancelled"
  | "unknown"

export type OrderStatusMetadata = Record<string, unknown> & {
  is_paid?: boolean | undefined
}

export type OrderVariant = {
  id?: string | undefined
  title?: string | null | undefined
  sku?: string | null | undefined
}

export type OrderLineItem = {
  id: string
  product: {
    id: string
    title: string
    handle: string
    thumbnail: string
    unit_price: number
    quantity: number
    subtotal: number
    variant: OrderVariant | null | undefined
  }
  title: string
  subtitle?: string | null | undefined
  thumbnail?: string | null | undefined
  unit_price: number
  quantity: number
  subtotal: number
  variant?: OrderVariant | null | undefined
}

export type OrderShippingAddress = {
  first_name?: string | null | undefined
  last_name?: string | null | undefined
  phone?: string | null | undefined
  address_1?: string | null | undefined
  address_2?: string | null | undefined
  city?: string | null | undefined
  province?: string | null | undefined
  postal_code?: string | null | undefined
}

export type OrderSeller = {
  id: string
  name: string
  address_line?: string | null | undefined
  city?: string | null | undefined
  state?: string | null | undefined
  postal_code?: string | null | undefined
  country_code?: string | null | undefined
  email?: string | null | undefined
  phone?: string | null | undefined
  photo?: string | null | undefined
  reviews?: unknown[] | undefined
}

export type OrderPayment = {
  provider_id?: string | null | undefined
}

export type OrderPaymentSessionData = Record<string, unknown> & {
  client_secret?: string | null | undefined
}

export type OrderPaymentSession = {
  id: string
  provider_id: string
  status: string
  created_at?: string | null | undefined
  data?: OrderPaymentSessionData | null | undefined
}

export type OrderPaymentCollection = {
  id: string
  payment_sessions?: OrderPaymentSession[] | undefined
  payments?: OrderPayment[] | undefined
}

export type OrderSetReference = {
  id: string
}

export type OrderFulfillmentLabel = {
  tracking_number?: string | null | undefined
  tracking_url?: string | null | undefined
}

export type OrderFulfillment = {
  labels?: OrderFulfillmentLabel[] | undefined
}

type OrderBase = {
  id: string
  display_id: number
  created_at: string
  currency_code: string
  status: OrderStatus
  payment_status: PaymentStatus
  fulfillment_status: FulfillmentStatus
  metadata?: OrderStatusMetadata | null | undefined
  shipping_total: number
  discount_total: number
  subtotal: number
  total: number
  items: OrderLineItem[]
  fulfillments?: OrderFulfillment[] | undefined
}

export type OrderListItem = OrderBase & {
  seller?: OrderSeller | null | undefined
  store?:
    | {
        name?: string | null | undefined
      }
    | null
    | undefined
  order_set?: OrderSetReference | null | undefined
  payment_provider_id?: string | null | undefined
  reviews?: unknown[] | undefined
  shipping_address?: OrderShippingAddress | null | undefined
  payment_collections?: OrderPaymentCollection[] | undefined
  payments?: OrderPayment[] | undefined
  email?: string | null | undefined
}

export type OrderDetails = OrderListItem

export type ReturnReason = {
  id: string
  label: string
}

export type ReturnShippingMethod = {
  id: string
  name: string
}

export type CustomerPaymentMethod = {
  id: string
  brand?: string | null | undefined
  last4?: string | null | undefined
  exp_month?: number | null | undefined
  exp_year?: number | null | undefined
  funding?: string | null | undefined
  country?: string | null | undefined
  is_default: boolean
}

export type ReturnRequestLineItemInput = {
  line_item_id: string
  quantity: number
  reason_id: string
}

export type CreateReturnRequestInput = {
  order_id: string
  customer_note: string
  shipping_option_id: string
  line_items: ReturnRequestLineItemInput[]
}

export type OrderReturnRequest = {
  id: string
}

export type CreateReturnRequestResult = {
  order_return_request: OrderReturnRequest
}

export type OrderFiltersValue = string | number | boolean | undefined
export type OrderFilters = Record<string, OrderFiltersValue>

export type OrderMutationResult<T, K extends string> =
  | ({ success: true; error: null } & Record<K, T>)
  | ({ success: false; error: string } & Record<K, null>)

export type OrderMutationOrder = {
  id: string
} & Record<string, unknown>

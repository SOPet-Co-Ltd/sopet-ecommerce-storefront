export const CUSTOMER_CART_ITEM_STATUS = {
  IN_CART: "in_cart",
  MOVED_TO_CHECKOUT: "moved_to_checkout",
} as const

export type CustomerCartItemStatus =
  (typeof CUSTOMER_CART_ITEM_STATUS)[keyof typeof CUSTOMER_CART_ITEM_STATUS]

export interface CustomerCart {
  id: string
  customerId: string
}

export interface CustomerCartItem {
  id: string
  cartId: string
  productId: string
  variantId: string
  quantity: number
  unitPriceSnapshot?: number | null
  status: CustomerCartItemStatus
  source?: string | null
  metadata?: Record<string, unknown> | null
}

export interface CustomerCartItemCreateInput {
  productId: string
  variantId: string
  quantity: number
  unitPriceSnapshot?: number | null
  source?: string | null
  metadata?: Record<string, unknown> | null
}

export interface AnonymousCartItemInput extends CustomerCartItemCreateInput {
  id?: string
}

export type CustomerCartListId = string & { __brand: "CustomerCartListId" }

export interface CustomerCartList {
  id: CustomerCartListId
  name: string
  items: CustomerCartItem[]
}

export type CustomerCartSelectionState = Record<CustomerCartListId, boolean>

export interface TransferToMedusaInput {
  customerCartItemIds: string[]
  regionId?: string
  salesChannelId?: string
  currencyCode?: string
}

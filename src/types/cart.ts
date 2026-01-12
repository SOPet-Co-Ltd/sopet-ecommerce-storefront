import { HttpTypes } from "@medusajs/types"

export interface Cart extends Omit<HttpTypes.StoreCart, "promotions"> {
  promotions?: HttpTypes.StorePromotion[]
  gift_cards?: any[]
  shipping_methods?: any[]
  payment_collection?: any
}

export type StoreCardShippingMethod = HttpTypes.StoreCartShippingOption & {
  seller_id?: string
  seller_name?: string
  rules?: any[] // TODO: Define strict type for rules if possible
  service_zone?: {
    fulfillment_set: {
      type: string
    }
  }
}

export interface StoreCartLineItemOptimisticUpdate
  extends Partial<HttpTypes.StoreCartLineItem> {
  tax_total: number
}

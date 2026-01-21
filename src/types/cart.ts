import { HttpTypes } from "@medusajs/types"

export interface StoreGiftCard {
  id: string
  code: string
  value: number
  balance: number
}

export interface Cart extends Omit<
  HttpTypes.StoreCart,
  "promotions" | "payment_collection" | "shipping_methods"
> {
  promotions?: HttpTypes.StoreCartPromotion[]
  gift_cards?: StoreGiftCard[]
  shipping_methods?: HttpTypes.StoreCartShippingMethod[]
  payment_collection?: HttpTypes.StorePaymentCollection
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

export interface StoreCartLineItemOptimisticUpdate extends Partial<HttpTypes.StoreCartLineItem> {
  tax_total: number
}

// Check with seller.ts imports
import { Seller } from "./seller"

export type ExtendedLineItem = HttpTypes.StoreCartLineItem & {
  product?: HttpTypes.StoreProduct & {
    seller?: Seller
  }
}

export type GroupedItems = Record<
  string,
  {
    seller: Seller
    items: ExtendedLineItem[]
  }
>

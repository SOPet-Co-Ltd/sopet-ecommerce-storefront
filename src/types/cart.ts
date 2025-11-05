import { HttpTypes } from "@medusajs/types"

export interface Cart extends HttpTypes.StoreCart {
  promotions: HttpTypes.StoreCartPromotion[]
}

export interface StoreCartLineItemOptimisticUpdate
  extends Partial<HttpTypes.StoreCartLineItem> {
  tax_total: number
}

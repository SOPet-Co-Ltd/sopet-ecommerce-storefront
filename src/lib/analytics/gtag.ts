/**
 * GTM dataLayer event tracking (GA4 ecommerce format)
 * Documentation: https://developers.google.com/tag-platform/tag-manager/ecommerce-ga4
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const canTrack = (): boolean => {
  if (typeof window === "undefined") return false
  if (process.env.NODE_ENV !== "production") return false
  window.dataLayer = window.dataLayer || []
  return true
}

const pushEcommerceEvent = (
  event: string,
  ecommerce: Record<string, unknown>
) => {
  if (!canTrack()) return
  window.dataLayer!.push({ ecommerce: null })
  window.dataLayer!.push({ event, ecommerce })
}

const pushEvent = (payload: Record<string, unknown>) => {
  if (!canTrack()) return
  window.dataLayer!.push(payload)
}

// Product/Item interface for GA4
export interface GA4Item {
  item_id: string // Product ID
  item_name: string // Product name
  affiliation?: string // Store/vendor name
  coupon?: string // Coupon code
  currency?: string // Currency (e.g., "THB", "USD")
  discount?: number // Discount amount
  index?: number // Position in list
  item_brand?: string // Brand name
  item_category?: string // Product category
  item_category2?: string // Product category (level 2)
  item_category3?: string // Product category (level 3)
  item_category4?: string // Product category (level 4)
  item_category5?: string // Product category (level 5)
  item_list_id?: string // List ID
  item_list_name?: string // List name
  item_variant?: string // Product variant
  location_id?: string // Physical location
  price?: number // Product price
  quantity?: number // Quantity
}

// E-commerce event parameters
export interface EcommerceEventParams {
  currency?: string
  value?: number
  items: GA4Item[]
  coupon?: string
  payment_type?: string
  shipping_tier?: string
  transaction_id?: string
  tax?: number
  shipping?: number
}

/**
 * Track page view
 */
export const pageview = (url: string) => {
  pushEvent({
    event: "page_view",
    page_path: url,
    page_location: window.location.href,
  })
}

/**
 * Track custom event
 */
export const event = (action: string, params?: Record<string, unknown>) => {
  pushEvent({ event: action, ...params })
}

/**
 * E-commerce: View item list (product listing page)
 */
export const viewItemList = (params: {
  item_list_id?: string
  item_list_name?: string
  items: GA4Item[]
}) => {
  pushEcommerceEvent("view_item_list", params)
}

/**
 * E-commerce: View item (product detail page)
 */
export const viewItem = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  pushEcommerceEvent("view_item", params)
}

/**
 * E-commerce: Add to cart
 */
export const addToCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  pushEcommerceEvent("add_to_cart", params)
}

/**
 * E-commerce: Remove from cart
 */
export const removeFromCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  pushEcommerceEvent("remove_from_cart", params)
}

/**
 * E-commerce: Begin checkout
 */
export const beginCheckout = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
  coupon?: string
}) => {
  pushEcommerceEvent("begin_checkout", params)
}

/**
 * E-commerce: Add shipping info
 */
export const addShippingInfo = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
  coupon?: string
  shipping_tier?: string
}) => {
  pushEcommerceEvent("add_shipping_info", params)
}

/**
 * E-commerce: Add payment info
 */
export const addPaymentInfo = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
  coupon?: string
  payment_type?: string
}) => {
  pushEcommerceEvent("add_payment_info", params)
}

/**
 * E-commerce: Purchase (order complete)
 */
export const purchase = (params: {
  transaction_id: string
  currency?: string
  value: number
  items: GA4Item[]
  coupon?: string
  shipping?: number
  tax?: number
  affiliation?: string
}) => {
  pushEcommerceEvent("purchase", params)
}

/**
 * E-commerce: View cart
 */
export const viewCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  pushEcommerceEvent("view_cart", params)
}

/**
 * E-commerce: Select item (click on product in list)
 */
export const selectItem = (params: {
  item_list_id?: string
  item_list_name?: string
  items: GA4Item[]
}) => {
  pushEcommerceEvent("select_item", params)
}

/**
 * Search event
 */
export const search = (searchTerm: string) => {
  pushEvent({
    event: "search",
    search_term: searchTerm,
  })
}

/**
 * Scroll depth tracking
 * @param percentage - Scroll depth percentage (25, 50, 75, 90, 100)
 */
export const scrollDepth = (percentage: number) => {
  pushEvent({
    event: "scroll",
    percent_scrolled: percentage,
  })
}

/**
 * File download tracking
 * @param fileName - Name of the file being downloaded
 * @param fileExtension - File extension (e.g., "pdf", "zip")
 * @param fileUrl - URL of the file
 */
export const fileDownload = (
  fileName: string,
  fileExtension: string,
  fileUrl: string
) => {
  pushEvent({
    event: "file_download",
    file_name: fileName,
    file_extension: fileExtension,
    link_url: fileUrl,
  })
}

/**
 * Outbound link click tracking
 * @param url - External URL being clicked
 * @param linkText - Text of the link (optional)
 */
export const outboundClick = (url: string, linkText?: string) => {
  pushEvent({
    event: "click",
    link_url: url,
    link_text: linkText,
    outbound: true,
  })
}

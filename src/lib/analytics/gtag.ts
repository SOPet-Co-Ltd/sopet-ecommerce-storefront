/**
 * Google Analytics 4 E-commerce Event Tracking
 * Documentation: https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void
  }
}

// Check if gtag is available
const isGtagAvailable = (): boolean => {
  return typeof window !== "undefined" && typeof window.gtag === "function"
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
  if (!isGtagAvailable()) return

  window.gtag!("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
    page_path: url,
  })
}

/**
 * Track custom event
 */
export const event = (action: string, params?: Record<string, any>) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", action, params)
}

/**
 * E-commerce: View item list (product listing page)
 */
export const viewItemList = (params: {
  item_list_id?: string
  item_list_name?: string
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "view_item_list", params)
}

/**
 * E-commerce: View item (product detail page)
 */
export const viewItem = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "view_item", params)
}

/**
 * E-commerce: Add to cart
 */
export const addToCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "add_to_cart", params)
}

/**
 * E-commerce: Remove from cart
 */
export const removeFromCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "remove_from_cart", params)
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "begin_checkout", params)
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "add_shipping_info", params)
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "add_payment_info", params)
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "purchase", params)
}

/**
 * E-commerce: View cart
 */
export const viewCart = (params: {
  currency?: string
  value?: number
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "view_cart", params)
}

/**
 * E-commerce: Select item (click on product in list)
 */
export const selectItem = (params: {
  item_list_id?: string
  item_list_name?: string
  items: GA4Item[]
}) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "select_item", params)
}

/**
 * Search event
 */
export const search = (searchTerm: string) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "search", {
    search_term: searchTerm,
  })
}

/**
 * Scroll depth tracking
 * @param percentage - Scroll depth percentage (25, 50, 75, 90, 100)
 */
export const scrollDepth = (percentage: number) => {
  if (!isGtagAvailable()) return

  window.gtag!("event", "scroll", {
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "file_download", {
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
  if (!isGtagAvailable()) return

  window.gtag!("event", "click", {
    link_url: url,
    link_text: linkText,
    outbound: true,
  })
}

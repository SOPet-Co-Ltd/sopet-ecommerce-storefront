import { useCallback } from "react"
import * as gtag from "./gtag"
import type { GA4Item } from "./gtag"

/**
 * React hook for Google Analytics tracking
 */
export const useAnalytics = () => {
  const trackPageView = useCallback((url: string) => {
    gtag.pageview(url)
  }, [])

  const trackEvent = useCallback(
    (action: string, params?: Record<string, any>) => {
      gtag.event(action, params)
    },
    []
  )

  const trackSearch = useCallback((searchTerm: string) => {
    gtag.search(searchTerm)
  }, [])

  // E-commerce tracking
  const trackViewItemList = useCallback(
    (params: {
      item_list_id?: string
      item_list_name?: string
      items: GA4Item[]
    }) => {
      gtag.viewItemList(params)
    },
    []
  )

  const trackViewItem = useCallback(
    (params: { currency?: string; value?: number; items: GA4Item[] }) => {
      gtag.viewItem(params)
    },
    []
  )

  const trackAddToCart = useCallback(
    (params: { currency?: string; value?: number; items: GA4Item[] }) => {
      gtag.addToCart(params)
    },
    []
  )

  const trackRemoveFromCart = useCallback(
    (params: { currency?: string; value?: number; items: GA4Item[] }) => {
      gtag.removeFromCart(params)
    },
    []
  )

  const trackViewCart = useCallback(
    (params: { currency?: string; value?: number; items: GA4Item[] }) => {
      gtag.viewCart(params)
    },
    []
  )

  const trackBeginCheckout = useCallback(
    (params: {
      currency?: string
      value?: number
      items: GA4Item[]
      coupon?: string
    }) => {
      gtag.beginCheckout(params)
    },
    []
  )

  const trackAddShippingInfo = useCallback(
    (params: {
      currency?: string
      value?: number
      items: GA4Item[]
      coupon?: string
      shipping_tier?: string
    }) => {
      gtag.addShippingInfo(params)
    },
    []
  )

  const trackAddPaymentInfo = useCallback(
    (params: {
      currency?: string
      value?: number
      items: GA4Item[]
      coupon?: string
      payment_type?: string
    }) => {
      gtag.addPaymentInfo(params)
    },
    []
  )

  const trackPurchase = useCallback(
    (params: {
      transaction_id: string
      currency?: string
      value: number
      items: GA4Item[]
      coupon?: string
      shipping?: number
      tax?: number
      affiliation?: string
    }) => {
      gtag.purchase(params)
    },
    []
  )

  const trackSelectItem = useCallback(
    (params: {
      item_list_id?: string
      item_list_name?: string
      items: GA4Item[]
    }) => {
      gtag.selectItem(params)
    },
    []
  )

  const trackScrollDepth = useCallback((percentage: number) => {
    gtag.scrollDepth(percentage)
  }, [])

  const trackFileDownload = useCallback(
    (fileName: string, fileExtension: string, fileUrl: string) => {
      gtag.fileDownload(fileName, fileExtension, fileUrl)
    },
    []
  )

  const trackOutboundClick = useCallback((url: string, linkText?: string) => {
    gtag.outboundClick(url, linkText)
  }, [])

  return {
    trackPageView,
    trackEvent,
    trackSearch,
    trackViewItemList,
    trackViewItem,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackAddShippingInfo,
    trackAddPaymentInfo,
    trackPurchase,
    trackSelectItem,
    trackScrollDepth,
    trackFileDownload,
    trackOutboundClick,
  }
}

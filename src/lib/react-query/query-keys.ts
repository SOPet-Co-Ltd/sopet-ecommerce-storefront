export const queryKeys = {
  cart: {
    all: () => ["cart"] as const,
    page: (locale: string, source: "customer" | "anonymous") =>
      ["cart", "page", source, locale] as const,
  },
  checkout: {
    all: () => ["checkout"] as const,
    cart: (cartId: string) => ["checkout", "cart", cartId] as const,
    pageData: (cartId: string, regionId: string | null | undefined) =>
      ["checkout", "page-data", cartId, regionId ?? ""] as const,
    savedPaymentMethods: (customerId: string | null | undefined) =>
      ["checkout", "saved-payment-methods", customerId ?? ""] as const,
  },
  orders: {
    all: () => ["orders"] as const,
    list: (limit: number, offset: number) =>
      ["orders", "list", limit, offset] as const,
    detail: (orderId: string) => ["orders", "detail", orderId] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
    page: () => ["notifications", "page"] as const,
  },
  coupons: {
    all: () => ["coupons"] as const,
    page: () => ["coupons", "page"] as const,
    discountModal: (
      cartId: string | null | undefined,
      vendorName: string | null | undefined,
      eligibilityFingerprint: string | null | undefined
    ) =>
      [
        "coupons",
        "discount-modal",
        cartId ?? "",
        vendorName ?? "",
        eligibilityFingerprint ?? "",
      ] as const,
  },
  ads: {
    all: () => ["ads"] as const,
    modal: () => ["ads", "modal"] as const,
  },
} as const

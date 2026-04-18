export const queryKeys = {
  cart: {
    all: () => ["cart"] as const,
    page: (locale: string, source: "customer" | "anonymous") =>
      ["cart", "page", source, locale] as const,
  },
  checkout: {
    all: () => ["checkout"] as const,
    pageData: (cartId: string, regionId: string | null | undefined) =>
      ["checkout", "page-data", cartId, regionId ?? ""] as const,
    savedPaymentMethods: (customerId: string | null | undefined) =>
      ["checkout", "saved-payment-methods", customerId ?? ""] as const,
  },
} as const

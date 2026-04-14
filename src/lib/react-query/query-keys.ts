export const queryKeys = {
  cart: {
    all: () => ["cart"] as const,
    page: (locale: string, source: "customer" | "anonymous") =>
      ["cart", "page", source, locale] as const,
  },
} as const

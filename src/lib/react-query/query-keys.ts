export const queryKeys = {
  products: {
    all: () => ["products"] as const,
    byHandle: (locale: string, handle: string) =>
      ["products", "by-handle", locale, handle] as const,
  },
  carts: {
    all: () => ["carts"] as const,
    byId: (id: string) => ["carts", id] as const,
  },
  customers: {
    me: () => ["customers", "me"] as const,
  },
} as const

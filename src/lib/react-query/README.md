# React Query Helpers

This folder contains shared utilities for `@tanstack/react-query` setup and conventions.

## Files

- `query-client.ts`: QueryClient factory and default options.
- `query-keys.ts`: centralized query key builders.
- `query-options.ts`: helper to build typed query options.
- `fetcher.ts`: Medusa fetcher factories for queries and mutations.
- `index.ts`: public exports.

## 1) Query client setup

`createQueryClient` returns a `QueryClient` with app defaults:

- `staleTime`: 1 minute
- `gcTime`: 5 minutes
- queries retry once
- mutations do not retry
- `refetchOnWindowFocus` disabled

Provider usage example:

```ts
"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { PropsWithChildren, useState } from "react"
import { createQueryClient } from "@/lib/react-query"

export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

## 2) Query keys

Use `queryKeys` to avoid ad-hoc string arrays in features.

```ts
import { queryKeys } from "@/lib/react-query"

const key1 = queryKeys.products.all()
const key2 = queryKeys.products.byHandle("th", "dog-food")
const key3 = queryKeys.customers.me()
```

When adding a new server query, add a key helper first.

Example: add product list key by category.

```ts
// query-keys.ts
export const queryKeys = {
  products: {
    all: () => ["products"] as const,
    byHandle: (locale: string, handle: string) =>
      ["products", "by-handle", locale, handle] as const,
    byCategory: (locale: string, category: string) =>
      ["products", "by-category", locale, category] as const,
  },
} as const
```

## 3) Create query function (fetcher)

Keep fetchers in feature files (or `lib/data/*`) and make them throw on failed requests.

```ts
type Product = { id: string; title: string }

export const fetchProductByHandle = async (
  locale: string,
  handle: string
): Promise<Product> => {
  const res = await fetch(`/api/products?locale=${locale}&handle=${handle}`)

  if (!res.ok) {
    throw new Error("Failed to fetch product")
  }

  return res.json()
}
```

## 4) Create query hook with options

Use `buildQueryOptions` to keep query config shape consistent.

```ts
import { useQuery } from "@tanstack/react-query"
import { buildQueryOptions, queryKeys } from "@/lib/react-query"
import { fetchProductByHandle } from "./api"

const useProduct = (locale: string, handle: string) => {
  return useQuery(
    buildQueryOptions({
      queryKey: queryKeys.products.byHandle(locale, handle),
      queryFn: () => fetchProductByHandle(locale, handle),
      enabled: Boolean(locale && handle),
    })
  )
}
```

## 5) Use custom Medusa fetcher (recommended)

Use `createMedusaQueryFn` and `createMedusaMutationFn` to reuse SDK fetch logic and
standardized error objects.

```ts
import { useQuery } from "@tanstack/react-query"
import {
  buildQueryOptions,
  createMedusaQueryFn,
  queryKeys,
} from "@/lib/react-query"

type ProductsResponse = { products: Array<{ id: string; title: string }> }

export const useProductsByCategory = (locale: string, categoryId: string) => {
  return useQuery(
    buildQueryOptions({
      queryKey: ["products", "by-category", locale, categoryId] as const,
      queryFn: createMedusaQueryFn<ProductsResponse>({
        path: "/store/products",
        query: {
          country_code: locale,
          category_id: categoryId,
          limit: 12,
        },
      }),
      enabled: Boolean(locale && categoryId),
    })
  )
}
```

## 6) Invalidate cache after mutation

After create/update/delete mutations, invalidate related keys.

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/react-query"

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { id: string; title: string }) => {
      const res = await fetch(`/api/products/${payload.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error("Failed to update product")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
  })
}
```

## Notes / Best Practice

- Keep all keys in `query-keys.ts` so invalidation is predictable.
- Prefer feature hooks (`useXxxQuery`) over calling `useQuery` directly in many components.
- Use stable query keys and avoid inline object literals unless needed.
- Use one key helper per query shape, then pass different params for different data.

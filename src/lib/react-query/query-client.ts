"use client"

import { QueryClient, type DefaultOptions } from "@tanstack/react-query"

const ONE_MINUTE = 60 * 1000

export const reactQueryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: ONE_MINUTE,
    gcTime: 5 * ONE_MINUTE,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: 0,
  },
}

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: reactQueryDefaultOptions,
  })

"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { type PropsWithChildren, useState } from "react"

import { createQueryClient } from "@/lib/react-query/query-client"

export const ReactQueryProvider = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

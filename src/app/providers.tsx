"use client"

import { NavigationProgress } from "@/components/atoms/NavigationProgress/NavigationProgress"
import { RouteLoadingProvider } from "@/components/atoms/RouteLoadingFallback/RouteLoadingProvider"
import { ProductCacheProvider, ReactQueryProvider } from "@/components/providers"
import type React from "react"

import { PropsWithChildren } from "react"

export function Providers({ children }: PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <ProductCacheProvider>
        <RouteLoadingProvider>
          <NavigationProgress />
          {children}
        </RouteLoadingProvider>
      </ProductCacheProvider>
    </ReactQueryProvider>
  )
}

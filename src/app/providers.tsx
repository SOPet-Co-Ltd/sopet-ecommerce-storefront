"use client"

import { NavigationProgress } from "@/components/atoms/NavigationProgress/NavigationProgress"
import { AnalyticsBehaviorTracker } from "@/components/AnalyticsBehaviorTracker"
import { RouteLoadingProvider } from "@/components/atoms/RouteLoadingFallback/RouteLoadingProvider"
import {
  ProductCacheProvider,
  ReactQueryProvider,
} from "@/components/providers"
import type React from "react"

import { PropsWithChildren } from "react"

export function Providers({ children }: PropsWithChildren) {
  return (
    <ReactQueryProvider>
      <ProductCacheProvider>
        <RouteLoadingProvider>
          <NavigationProgress />
          <AnalyticsBehaviorTracker />
          {children}
        </RouteLoadingProvider>
      </ProductCacheProvider>
    </ReactQueryProvider>
  )
}

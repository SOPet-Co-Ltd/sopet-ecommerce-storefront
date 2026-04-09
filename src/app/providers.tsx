"use client"

import { NavigationProgress } from "@/components/atoms/NavigationProgress/NavigationProgress"
import { RouteLoadingProvider } from "@/components/atoms/RouteLoadingFallback/RouteLoadingProvider"
import { CartProvider, ReactQueryProvider } from "@/components/providers"
import { Cart } from "@/types/cart"
import type React from "react"

import { PropsWithChildren } from "react"

interface ProvidersProps extends PropsWithChildren {
  cart: Cart | null
}

export function Providers({ children, cart }: ProvidersProps) {
  return (
    <ReactQueryProvider>
      <CartProvider cart={cart}>
        <RouteLoadingProvider>
          <NavigationProgress />
          {children}
        </RouteLoadingProvider>
      </CartProvider>
    </ReactQueryProvider>
  )
}

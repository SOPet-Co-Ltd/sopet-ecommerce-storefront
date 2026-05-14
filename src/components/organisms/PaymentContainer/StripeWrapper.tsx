"use client"

import { createContext, type ReactNode } from "react"

export const StripeContext = createContext(false)

type StripeWrapperProps = {
  children: ReactNode
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({ children }) => {
  return (
    <StripeContext.Provider value={false}>{children}</StripeContext.Provider>
  )
}

export default StripeWrapper

"use client"

import { createContext, useContext, useState } from "react"
import { HttpTypes } from "@medusajs/types"

type CheckoutPaymentMethod = "qrcode" | "card"

type CheckoutPaymentContextValue = {
  method: CheckoutPaymentMethod
  setMethod: (method: CheckoutPaymentMethod) => void
  cardholderName: string
  setCardholderName: (name: string) => void
  cardComplete: boolean
  setCardComplete: (complete: boolean) => void
  cardError: string | null
  setCardError: (error: string | null) => void
  selectedAddress:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  setSelectedAddress: (
    address:
      | HttpTypes.StoreCustomerAddress
      | HttpTypes.StoreCartAddress
      | null
  ) => void
  selectedEmail: string
  setSelectedEmail: (email: string) => void
}

const CheckoutPaymentContext = createContext<CheckoutPaymentContextValue | null>(
  null
)

export function CheckoutPaymentProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [method, setMethod] = useState<CheckoutPaymentMethod>("card")
  const [cardholderName, setCardholderName] = useState("")
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState<string | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  >(null)
  const [selectedEmail, setSelectedEmail] = useState("")

  return (
    <CheckoutPaymentContext.Provider
      value={{
        method,
        setMethod,
        cardholderName,
        setCardholderName,
        cardComplete,
        setCardComplete,
        cardError,
        setCardError,
        selectedAddress,
        setSelectedAddress,
        selectedEmail,
        setSelectedEmail,
      }}
    >
      {children}
    </CheckoutPaymentContext.Provider>
  )
}

export function useCheckoutPayment() {
  const context = useContext(CheckoutPaymentContext)
  if (!context) {
    throw new Error(
      "useCheckoutPayment must be used within CheckoutPaymentProvider"
    )
  }
  return context
}

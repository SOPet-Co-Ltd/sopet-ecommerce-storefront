"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import type { CustomerPaymentMethod } from "@/lib/data/customer"

export type CheckoutPaymentMethod = "qrcode" | "card"

/** Draft shipping address (form-only until "Proceed with payment"). */
export type DraftShippingAddress = {
  first_name: string
  last_name: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone: string
}

type CheckoutPaymentContextValue = {
  method: CheckoutPaymentMethod
  setMethod: (method: CheckoutPaymentMethod) => void
  cardholderName: string
  setCardholderName: (name: string) => void
  cardComplete: boolean
  setCardComplete: (complete: boolean) => void
  /** Returns the latest cardComplete at call time (avoids stale closure in async validation). */
  getCardComplete: () => boolean
  cardError: string | null
  setCardError: (error: string | null) => void
  selectedAddress:
    | HttpTypes.StoreCustomerAddress
    | HttpTypes.StoreCartAddress
    | null
  setSelectedAddress: (
    address: HttpTypes.StoreCustomerAddress | HttpTypes.StoreCartAddress | null
  ) => void
  selectedEmail: string
  setSelectedEmail: (email: string) => void
  /** True when shipping address is from inline form (not yet saved to DB). */
  shippingAddressIsDraft: boolean
  setShippingAddressIsDraft: (value: boolean) => void
  /** Draft address fields when user has no saved address; only updated in context until proceed. */
  draftAddress: DraftShippingAddress
  setDraftAddress: (
    address:
      | DraftShippingAddress
      | ((prev: DraftShippingAddress) => DraftShippingAddress)
  ) => void
  /** Saved Stripe payment methods for the customer (fetched when method is card). */
  savedPaymentMethods: CustomerPaymentMethod[]
  setSavedPaymentMethods: (
    methods:
      | CustomerPaymentMethod[]
      | ((prev: CustomerPaymentMethod[]) => CustomerPaymentMethod[])
  ) => void
  /** Selected saved payment method id (when not using new card). */
  selectedPaymentMethodId: string | null
  setSelectedPaymentMethodId: (id: string | null) => void
  /** True when user chose "add new card" and is filling the card form (no save until proceed). */
  useNewCard: boolean
  setUseNewCard: (value: boolean) => void
}

const defaultDraftAddress: DraftShippingAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "th",
  phone: "",
}

const CheckoutPaymentContext =
  createContext<CheckoutPaymentContextValue | null>(null)

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
    HttpTypes.StoreCustomerAddress | HttpTypes.StoreCartAddress | null
  >(null)
  const [selectedEmail, setSelectedEmail] = useState("")
  const [shippingAddressIsDraft, setShippingAddressIsDraft] = useState(false)
  const [draftAddress, setDraftAddressState] =
    useState<DraftShippingAddress>(defaultDraftAddress)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<
    CustomerPaymentMethod[]
  >([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    string | null
  >(null)
  const [useNewCard, setUseNewCard] = useState(false)
  const cardCompleteRef = useRef(false)

  useEffect(() => {
    cardCompleteRef.current = cardComplete
  }, [cardComplete])

  const getCardComplete = () => cardCompleteRef.current

  const setDraftAddress = (
    payload:
      | DraftShippingAddress
      | ((prev: DraftShippingAddress) => DraftShippingAddress)
  ) => {
    if (typeof payload === "function") {
      setDraftAddressState(payload)
    } else {
      setDraftAddressState(payload)
    }
  }

  return (
    <CheckoutPaymentContext.Provider
      value={{
        method,
        setMethod,
        cardholderName,
        setCardholderName,
        cardComplete,
        setCardComplete,
        getCardComplete,
        cardError,
        setCardError,
        selectedAddress,
        setSelectedAddress,
        selectedEmail,
        setSelectedEmail,
        shippingAddressIsDraft,
        setShippingAddressIsDraft,
        draftAddress,
        setDraftAddress,
        savedPaymentMethods,
        setSavedPaymentMethods,
        selectedPaymentMethodId,
        setSelectedPaymentMethodId,
        useNewCard,
        setUseNewCard,
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

import type { HttpTypes } from "@medusajs/types"
import { createStore } from "zustand/vanilla"

export type CheckoutPaymentMethod = "qrcode" | "card"

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

type CheckoutAddress =
  | HttpTypes.StoreCustomerAddress
  | HttpTypes.StoreCartAddress
  | null

type CheckoutPaymentState = {
  method: CheckoutPaymentMethod
  cardholderName: string
  cardComplete: boolean
  cardError: string | null
  selectedAddress: CheckoutAddress
  selectedEmail: string
  shippingAddressIsDraft: boolean
  draftAddress: DraftShippingAddress
  selectedPaymentMethodId: string | null
  useNewCard: boolean
  isPaymentSubmitting: boolean
  paymentSubmissionMessage: string | null
}

type CheckoutPaymentActions = {
  reset: () => void
  setMethod: (method: CheckoutPaymentMethod) => void
  setCardholderName: (name: string) => void
  setCardComplete: (complete: boolean) => void
  getCardComplete: () => boolean
  setCardError: (error: string | null) => void
  setSelectedAddress: (address: CheckoutAddress) => void
  setSelectedEmail: (email: string) => void
  setShippingAddressIsDraft: (value: boolean) => void
  setDraftAddress: (
    address:
      | DraftShippingAddress
      | ((prev: DraftShippingAddress) => DraftShippingAddress)
  ) => void
  setSelectedPaymentMethodId: (id: string | null) => void
  setUseNewCard: (value: boolean) => void
  startPaymentSubmission: (message?: string | null) => void
  setPaymentSubmissionMessage: (message: string | null) => void
  finishPaymentSubmission: () => void
}

export type CheckoutPaymentStore = CheckoutPaymentState & CheckoutPaymentActions

const getDefaultDraftAddress = (): DraftShippingAddress => ({
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "th",
  phone: "",
})

const getInitialState = (): CheckoutPaymentState => ({
  method: "card",
  cardholderName: "",
  cardComplete: false,
  cardError: null,
  selectedAddress: null,
  selectedEmail: "",
  shippingAddressIsDraft: false,
  draftAddress: getDefaultDraftAddress(),
  selectedPaymentMethodId: null,
  useNewCard: false,
  isPaymentSubmitting: false,
  paymentSubmissionMessage: null,
})

export function createCheckoutPaymentStore() {
  return createStore<CheckoutPaymentStore>((set, get) => ({
    ...getInitialState(),
    reset: () => {
      set(getInitialState())
    },
    setMethod: (method) => {
      set({ method })
    },
    setCardholderName: (cardholderName) => {
      set({ cardholderName })
    },
    setCardComplete: (cardComplete) => {
      set({ cardComplete })
    },
    getCardComplete: () => get().cardComplete,
    setCardError: (cardError) => {
      set({ cardError })
    },
    setSelectedAddress: (selectedAddress) => {
      set({ selectedAddress })
    },
    setSelectedEmail: (selectedEmail) => {
      set({ selectedEmail })
    },
    setShippingAddressIsDraft: (shippingAddressIsDraft) => {
      set({ shippingAddressIsDraft })
    },
    setDraftAddress: (payload) => {
      set((state) => ({
        draftAddress:
          typeof payload === "function"
            ? payload(state.draftAddress)
            : payload,
      }))
    },
    setSelectedPaymentMethodId: (selectedPaymentMethodId) => {
      set({ selectedPaymentMethodId })
    },
    setUseNewCard: (useNewCard) => {
      set({ useNewCard })
    },
    startPaymentSubmission: (paymentSubmissionMessage) => {
      set({
        isPaymentSubmitting: true,
        paymentSubmissionMessage:
          paymentSubmissionMessage ?? "กำลังดำเนินการชำระเงิน…",
      })
    },
    setPaymentSubmissionMessage: (paymentSubmissionMessage) => {
      set({ paymentSubmissionMessage })
    },
    finishPaymentSubmission: () => {
      set({
        isPaymentSubmitting: false,
        paymentSubmissionMessage: null,
      })
    },
  }))
}

export type CheckoutPaymentStoreApi = ReturnType<
  typeof createCheckoutPaymentStore
>

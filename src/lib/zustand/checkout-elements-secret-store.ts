import { createStore } from "zustand/vanilla"

type CheckoutElementsSecretState = {
  clientSecret: string | undefined
  elementsKey: number
  marketplacePaymentInitError: string | null
}

type CheckoutElementsSecretActions = {
  reset: () => void
  setClientSecret: (secret: string | undefined) => void
  bumpElementsKey: () => void
  setMarketplacePaymentInitError: (message: string | null) => void
}

export type CheckoutElementsSecretStore = CheckoutElementsSecretState &
  CheckoutElementsSecretActions

const getInitialState = (): CheckoutElementsSecretState => ({
  clientSecret: undefined,
  elementsKey: 0,
  marketplacePaymentInitError: null,
})

export function createCheckoutElementsSecretStore() {
  return createStore<CheckoutElementsSecretStore>((set) => ({
    ...getInitialState(),
    reset: () => {
      set(getInitialState())
    },
    setClientSecret: (clientSecret) => {
      set({ clientSecret })
    },
    bumpElementsKey: () => {
      set((state) => ({
        elementsKey: state.elementsKey + 1,
      }))
    },
    setMarketplacePaymentInitError: (marketplacePaymentInitError) => {
      set({ marketplacePaymentInitError })
    },
  }))
}

export type CheckoutElementsSecretStoreApi = ReturnType<
  typeof createCheckoutElementsSecretStore
>

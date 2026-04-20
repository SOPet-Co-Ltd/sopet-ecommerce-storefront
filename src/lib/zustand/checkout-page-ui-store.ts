import { create } from "zustand"

export type CheckoutPageUIState = {
  isShippingOpen: boolean
  editingSellerId: string | null
  isAutoSelectingShipping: boolean
  setIsShippingOpen: (isOpen: boolean) => void
  setEditingSellerId: (sellerId: string | null) => void
  setIsAutoSelectingShipping: (isLoading: boolean) => void
}

export const useCheckoutPageUIStore = create<CheckoutPageUIState>((set) => ({
  isShippingOpen: false,
  editingSellerId: null,
  isAutoSelectingShipping: false,
  setIsShippingOpen: (isOpen) => set({ isShippingOpen: isOpen }),
  setEditingSellerId: (sellerId) => set({ editingSellerId: sellerId }),
  setIsAutoSelectingShipping: (isLoading) =>
    set({ isAutoSelectingShipping: isLoading }),
}))

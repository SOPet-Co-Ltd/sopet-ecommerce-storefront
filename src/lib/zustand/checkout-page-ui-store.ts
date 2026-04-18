import { create } from "zustand"

export type CheckoutPageUIState = {
  isShippingOpen: boolean
  editingSellerId: string | null
  setIsShippingOpen: (isOpen: boolean) => void
  setEditingSellerId: (sellerId: string | null) => void
}

export const useCheckoutPageUIStore = create<CheckoutPageUIState>((set) => ({
  isShippingOpen: false,
  editingSellerId: null,
  setIsShippingOpen: (isOpen) => set({ isShippingOpen: isOpen }),
  setEditingSellerId: (sellerId) => set({ editingSellerId: sellerId }),
}))

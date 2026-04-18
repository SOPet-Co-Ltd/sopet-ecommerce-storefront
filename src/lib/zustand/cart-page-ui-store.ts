import { create } from "zustand"

type CartPageUiState = {
  selectedItemIds: string[]
  discountModalVendor: string | null
  reset: () => void
  setSelectedItemIds: (ids: string[]) => void
  toggleItemSelection: (id: string, checked: boolean) => void
  toggleManySelection: (ids: string[], checked: boolean) => void
  openDiscountModal: (vendorName: string) => void
  closeDiscountModal: () => void
}

export const useCartPageUiStore = create<CartPageUiState>((set) => ({
  selectedItemIds: [],
  discountModalVendor: null,
  reset: () =>
    set({
      selectedItemIds: [],
      discountModalVendor: null,
    }),
  setSelectedItemIds: (ids) =>
    set({
      selectedItemIds: Array.from(new Set(ids)),
    }),
  toggleItemSelection: (id, checked) =>
    set((state) => ({
      selectedItemIds: checked
        ? Array.from(new Set([...state.selectedItemIds, id]))
        : state.selectedItemIds.filter((candidate) => candidate !== id),
    })),
  toggleManySelection: (ids, checked) =>
    set((state) => {
      const next = checked
        ? Array.from(new Set([...state.selectedItemIds, ...ids]))
        : state.selectedItemIds.filter((candidate) => !ids.includes(candidate))

      return {
        selectedItemIds: next,
      }
    }),
  openDiscountModal: (vendorName) =>
    set({
      discountModalVendor: vendorName,
    }),
  closeDiscountModal: () =>
    set({
      discountModalVendor: null,
    }),
}))

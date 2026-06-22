import { create } from "zustand"

type CartPageUiState = {
  selectedItemIds: string[]
  discountModalVendor: string | null
  stagedPromotionCodes: string[]
  pendingQuantityItemIds: string[]
  reset: () => void
  setSelectedItemIds: (ids: string[]) => void
  toggleItemSelection: (id: string, checked: boolean) => void
  toggleManySelection: (ids: string[], checked: boolean) => void
  openDiscountModal: (vendorName: string) => void
  closeDiscountModal: () => void
  stagePromotionCode: (code: string) => void
  unstagePromotionCode: (code: string) => void
  clearStagedPromotionCodes: () => void
  setItemQuantityPending: (id: string, pending: boolean) => void
}

export const useCartPageUiStore = create<CartPageUiState>((set) => ({
  selectedItemIds: [],
  discountModalVendor: null,
  stagedPromotionCodes: [],
  pendingQuantityItemIds: [],
  reset: () =>
    set({
      selectedItemIds: [],
      discountModalVendor: null,
      stagedPromotionCodes: [],
      pendingQuantityItemIds: [],
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
  stagePromotionCode: (code) =>
    set((state) => ({
      stagedPromotionCodes: Array.from(
        new Set([...state.stagedPromotionCodes, code.trim()])
      ).filter((candidate) => candidate.length > 0),
    })),
  unstagePromotionCode: (code) =>
    set((state) => ({
      stagedPromotionCodes: state.stagedPromotionCodes.filter(
        (candidate) => candidate !== code
      ),
    })),
  clearStagedPromotionCodes: () =>
    set({
      stagedPromotionCodes: [],
    }),
  setItemQuantityPending: (id, pending) =>
    set((state) => {
      const hasId = state.pendingQuantityItemIds.includes(id)

      if (pending && hasId) {
        return state
      }

      if (!pending && !hasId) {
        return state
      }

      return {
        pendingQuantityItemIds: pending
          ? [...state.pendingQuantityItemIds, id]
          : state.pendingQuantityItemIds.filter(
              (candidate) => candidate !== id
            ),
      }
    }),
}))

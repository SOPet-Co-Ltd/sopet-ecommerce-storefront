import { createAppStore } from "./create-store"
import { withDevtools } from "./middlewares"
import { SetStateAction } from "react"

type SelectedVariant = Record<string, string>

type PdpUIState = {
  selectedVariant: SelectedVariant
  productQuantity: number
  isShareModalOpen: boolean
  setSelectedVariant: (variant: SelectedVariant) => void
  setProductQuantity: (quantity: SetStateAction<number>) => void
  resetQuantity: () => void
  setShareModalOpen: (isOpen: boolean) => void
  initializeProductState: (variant: SelectedVariant) => void
}

const initializer = withDevtools<PdpUIState>(
  (set) => ({
    selectedVariant: {},
    productQuantity: 1,
    isShareModalOpen: false,
    setSelectedVariant: (variant) => set({ selectedVariant: variant }),
    setProductQuantity: (quantity) =>
      set((state) => ({
        productQuantity:
          typeof quantity === "function"
            ? quantity(state.productQuantity)
            : quantity,
      })),
    resetQuantity: () => set({ productQuantity: 1 }),
    setShareModalOpen: (isOpen) => set({ isShareModalOpen: isOpen }),
    initializeProductState: (variant) =>
      set({
        selectedVariant: variant,
        productQuantity: 1,
        isShareModalOpen: false,
      }),
  }),
  "pdp-ui-store-devtools"
)

export const usePdpUIStore = createAppStore(initializer)

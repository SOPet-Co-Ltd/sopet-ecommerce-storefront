import { create } from "zustand"

import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"

type DiscountModalUiState = {
  contextKey: string | null
  manualCode: string
  selectedCoupon: CouponData | null
  error: string | null
  message: string | null
  activeCodes: string[]
  failedCouponReasons: Record<string, string>
  applyingCode: string | null
  collectingCouponId: string | null
  removingCode: string | null
  hydrateContext: (contextKey: string, activeCodes: string[]) => void
  resetTransientState: () => void
  setManualCode: (value: string) => void
  setSelectedCoupon: (coupon: CouponData | null) => void
  setError: (value: string | null) => void
  setMessage: (value: string | null) => void
  setActiveCodes: (codes: string[]) => void
  clearCouponFailure: (code: string) => void
  setCouponFailure: (code: string, reason: string) => void
  setApplyingCode: (code: string | null) => void
  setCollectingCouponId: (couponId: string | null) => void
  setRemovingCode: (code: string | null) => void
}

const INITIAL_TRANSIENT_STATE = {
  manualCode: "",
  selectedCoupon: null,
  error: null,
  message: null,
  failedCouponReasons: {},
  applyingCode: null,
  collectingCouponId: null,
  removingCode: null,
} satisfies Pick<
  DiscountModalUiState,
  | "manualCode"
  | "selectedCoupon"
  | "error"
  | "message"
  | "failedCouponReasons"
  | "applyingCode"
  | "collectingCouponId"
  | "removingCode"
>

export const useDiscountModalUiStore = create<DiscountModalUiState>((set) => ({
  contextKey: null,
  activeCodes: [],
  ...INITIAL_TRANSIENT_STATE,
  hydrateContext: (contextKey, activeCodes) =>
    set((state) =>
      state.contextKey === contextKey
        ? {
            activeCodes,
          }
        : {
            contextKey,
            activeCodes,
            ...INITIAL_TRANSIENT_STATE,
          }
    ),
  resetTransientState: () =>
    set({
      ...INITIAL_TRANSIENT_STATE,
    }),
  setManualCode: (manualCode) =>
    set({
      manualCode,
    }),
  setSelectedCoupon: (selectedCoupon) =>
    set({
      selectedCoupon,
    }),
  setError: (error) =>
    set({
      error,
    }),
  setMessage: (message) =>
    set({
      message,
    }),
  setActiveCodes: (activeCodes) =>
    set({
      activeCodes,
    }),
  clearCouponFailure: (code) =>
    set((state) => {
      if (!(code in state.failedCouponReasons)) {
        return state
      }

      const nextReasons = { ...state.failedCouponReasons }
      delete nextReasons[code]

      return {
        failedCouponReasons: nextReasons,
      }
    }),
  setCouponFailure: (code, reason) =>
    set((state) => ({
      failedCouponReasons: {
        ...state.failedCouponReasons,
        [code]: reason,
      },
    })),
  setApplyingCode: (applyingCode) =>
    set({
      applyingCode,
    }),
  setCollectingCouponId: (collectingCouponId) =>
    set({
      collectingCouponId,
    }),
  setRemovingCode: (removingCode) =>
    set({
      removingCode,
    }),
}))

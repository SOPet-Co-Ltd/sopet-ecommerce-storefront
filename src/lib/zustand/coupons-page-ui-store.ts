import { create } from "zustand"

import type { CouponData } from "@/components/molecules/CouponCard/CouponCard"
import type { CouponsPageCategoryKey } from "@/lib/data/coupons-page"

type VisibleRowsByCategory = Record<CouponsPageCategoryKey, number>

type CouponsPageUiState = {
  selectedCoupon: CouponData | null
  showCollected: boolean
  showAuthError: boolean
  applyingCouponId: string | null
  visibleRowsByCategory: VisibleRowsByCategory
  openCouponConditions: (coupon: CouponData) => void
  closeCouponConditions: () => void
  openCollectedModal: () => void
  closeCollectedModal: () => void
  openAuthErrorModal: () => void
  closeAuthErrorModal: () => void
  setApplyingCouponId: (couponId: string | null) => void
  incrementVisibleRows: (category: CouponsPageCategoryKey) => void
}

const INITIAL_VISIBLE_ROWS: VisibleRowsByCategory = {
  new_customer: 2,
  shipping: 2,
  special: 2,
}

export const useCouponsPageUiStore = create<CouponsPageUiState>((set) => ({
  selectedCoupon: null,
  showCollected: false,
  showAuthError: false,
  applyingCouponId: null,
  visibleRowsByCategory: INITIAL_VISIBLE_ROWS,
  openCouponConditions: (coupon) =>
    set({
      selectedCoupon: coupon,
    }),
  closeCouponConditions: () =>
    set({
      selectedCoupon: null,
    }),
  openCollectedModal: () =>
    set({
      showCollected: true,
    }),
  closeCollectedModal: () =>
    set({
      showCollected: false,
    }),
  openAuthErrorModal: () =>
    set({
      showAuthError: true,
    }),
  closeAuthErrorModal: () =>
    set({
      showAuthError: false,
    }),
  setApplyingCouponId: (couponId) =>
    set({
      applyingCouponId: couponId,
    }),
  incrementVisibleRows: (category) =>
    set((state) => ({
      visibleRowsByCategory: {
        ...state.visibleRowsByCategory,
        [category]: state.visibleRowsByCategory[category] + 1,
      },
    })),
}))

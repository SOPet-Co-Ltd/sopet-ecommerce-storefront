"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { Button, Input } from "@/components/atoms"
import { Text } from "@medusajs/ui"
import { Ticket, X } from "lucide-react"
import { Cart } from "@/types/cart"
import { useCallback, useEffect, useMemo } from "react"
import { CouponCard } from "../CouponCard/CouponCard"
import type { CouponData } from "../CouponCard/CouponCard"
import { CouponConditionsModal } from "../CouponConditionsModal/CouponConditionsModal"
import { evaluateCouponEligibility } from "@/lib/helpers/coupon-eligibility"
import { checkoutPaymentFingerprint } from "@/lib/helpers/checkout-payment-fingerprint"
import { useCartPageUiStore } from "@/lib/zustand/cart-page-ui-store"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/react-query/query-keys"
import {
  useApplyCheckoutPromotionMutation,
  useDiscountModalCouponsQuery,
  useRemoveCheckoutPromotionMutation,
} from "@/hooks/useDiscountModalCouponsQuery"
import { useDiscountModalUiStore } from "@/lib/zustand/discount-modal-ui-store"
import { useCheckoutPageUIStore } from "@/lib/zustand/checkout-page-ui-store"

type DiscountModalProps = {
  isOpen: boolean
  close: () => void
  cart: Cart | null
  vendorName?: string
  showAppliedPromotions?: boolean
}

export const DiscountModal = ({
  isOpen,
  close,
  cart,
  vendorName,
  showAppliedPromotions = true,
}: DiscountModalProps) => {
  const queryClient = useQueryClient()
  const stagedPromotionCodes = useCartPageUiStore(
    (state) => state.stagedPromotionCodes
  )
  const stagePromotionCode = useCartPageUiStore(
    (state) => state.stagePromotionCode
  )
  const unstagePromotionCode = useCartPageUiStore(
    (state) => state.unstagePromotionCode
  )
  const manualCode = useDiscountModalUiStore((state) => state.manualCode)
  const setManualCode = useDiscountModalUiStore((state) => state.setManualCode)
  const selectedCoupon = useDiscountModalUiStore((state) => state.selectedCoupon)
  const setSelectedCoupon = useDiscountModalUiStore(
    (state) => state.setSelectedCoupon
  )
  const error = useDiscountModalUiStore((state) => state.error)
  const setError = useDiscountModalUiStore((state) => state.setError)
  const message = useDiscountModalUiStore((state) => state.message)
  const setMessage = useDiscountModalUiStore((state) => state.setMessage)
  const activeCodes = useDiscountModalUiStore((state) => state.activeCodes)
  const setActiveCodes = useDiscountModalUiStore((state) => state.setActiveCodes)
  const failedCouponReasons = useDiscountModalUiStore(
    (state) => state.failedCouponReasons
  )
  const clearCouponFailure = useDiscountModalUiStore(
    (state) => state.clearCouponFailure
  )
  const setCouponFailure = useDiscountModalUiStore(
    (state) => state.setCouponFailure
  )
  const hydrateContext = useDiscountModalUiStore((state) => state.hydrateContext)
  const applyingCode = useDiscountModalUiStore((state) => state.applyingCode)
  const setApplyingCode = useDiscountModalUiStore(
    (state) => state.setApplyingCode
  )
  const collectingCouponId = useDiscountModalUiStore(
    (state) => state.collectingCouponId
  )
  const setCollectingCouponId = useDiscountModalUiStore(
    (state) => state.setCollectingCouponId
  )
  const removingCode = useDiscountModalUiStore((state) => state.removingCode)
  const setRemovingCode = useDiscountModalUiStore((state) => state.setRemovingCode)
  const resetTransientState = useDiscountModalUiStore(
    (state) => state.resetTransientState
  )
  const isAutoSelectingShipping = useCheckoutPageUIStore(
    (state) => state.isAutoSelectingShipping
  )

  const appliedPromotions = useMemo(
    () => cart?.promotions ?? [],
    [cart?.promotions]
  )
  const serverAppliedCodes = useMemo(
    () =>
      appliedPromotions
        .map((promo) => promo.code)
        .filter(
          (code): code is string =>
            typeof code === "string" && code.length > 0
        ),
    [appliedPromotions]
  )
  const serverAppliedCodesKey = useMemo(
    () => [...serverAppliedCodes].sort().join("|"),
    [serverAppliedCodes]
  )
  const couponContextKey = useMemo(
    () =>
      [
        checkoutPaymentFingerprint(cart),
        vendorName ?? "",
        serverAppliedCodesKey,
      ].join("::"),
    [cart, serverAppliedCodesKey, vendorName]
  )
  const currentCartFingerprint = useMemo(
    () => checkoutPaymentFingerprint(cart),
    [cart]
  )
  const supportsDirectPromotionApply =
    typeof cart?.id === "string" && cart.id.startsWith("cart_")
  const checkoutCartId = supportsDirectPromotionApply ? cart?.id ?? null : null
  const checkoutCartQueryKey = useMemo(
    () =>
      supportsDirectPromotionApply && cart?.id
        ? queryKeys.checkout.cart(cart.id)
        : null,
    [supportsDirectPromotionApply, cart?.id]
  )
  const couponsQuery = useDiscountModalCouponsQuery({
    cart,
    vendorName,
  })
  const availableCoupons = couponsQuery.data?.coupons ?? []
  const isFetchingCoupons = couponsQuery.isPending && !couponsQuery.data
  const isPreparingCouponEligibility =
    supportsDirectPromotionApply &&
    (isAutoSelectingShipping || !couponsQuery.couponEligibilityReady)
  const applyCheckoutPromotionMutation =
    useApplyCheckoutPromotionMutation(checkoutCartId)
  const removeCheckoutPromotionMutation =
    useRemoveCheckoutPromotionMutation(checkoutCartId)
  const isMutating =
    Boolean(applyingCode) ||
    Boolean(collectingCouponId) ||
    Boolean(removingCode) ||
    applyCheckoutPromotionMutation.isPending ||
    removeCheckoutPromotionMutation.isPending

  const setOptimisticCheckoutPromotionCodes = useCallback(
    (nextCodes: string[]) => {
      if (!checkoutCartQueryKey) {
        return
      }

      queryClient.setQueryData<Cart | null>(checkoutCartQueryKey, (current) => {
        if (!current) {
          return current
        }

        const nextPromotions = nextCodes.map((code) => {
          const existingPromotion = (current.promotions ?? []).find(
            (promotion) => promotion.code === code
          )

          if (existingPromotion) {
            return existingPromotion
          }

          return {
            id: code,
            code,
          }
        })

        return {
          ...current,
          promotions: nextPromotions,
        }
      })
    },
    [checkoutCartQueryKey, queryClient]
  )

  useEffect(() => {
    if (!isOpen) {
      resetTransientState()
      return
    }

    hydrateContext(
      `${cart?.id ?? ""}::${vendorName ?? ""}::${serverAppliedCodesKey}`,
      Array.from(new Set([...serverAppliedCodes, ...stagedPromotionCodes]))
    )
  }, [
    cart?.id,
    hydrateContext,
    isOpen,
    resetTransientState,
    serverAppliedCodes,
    serverAppliedCodesKey,
    stagedPromotionCodes,
    vendorName,
  ])

  const handleApply = async (codeToApply: string) => {
    const normalizedCode = codeToApply.trim()
    if (!normalizedCode) return false
    const matchedCoupon = availableCoupons.find(
      (coupon) => coupon.code.trim().toLowerCase() === normalizedCode.toLowerCase()
    )
    const previousActiveCodes = [...activeCodes]
    setApplyingCode(normalizedCode)
    setError(null)
    setMessage(null)
    if (supportsDirectPromotionApply) {
      setMessage("กำลังใช้โค้ดส่วนลด…")
      setActiveCodes([normalizedCode])
      setOptimisticCheckoutPromotionCodes([normalizedCode])
    }
    clearCouponFailure(normalizedCode)

    try {
      if (!supportsDirectPromotionApply) {
        if (!matchedCoupon) {
          const failedReason = "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
          setError(failedReason)
          setCouponFailure(normalizedCode, failedReason)
          return false
        }

        const eligibility = evaluateCouponEligibility(matchedCoupon, {
          cart,
          appliedCodes,
          vendorName,
          cartFingerprint: currentCartFingerprint,
        })

        if (!eligibility.isEligible) {
          const failedReason =
            eligibility.disabledReason ||
            "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
          setError(failedReason)
          setCouponFailure(normalizedCode, failedReason)
          return false
        }

        stagePromotionCode(matchedCoupon.code)
        setManualCode("")
        setActiveCodes(Array.from(new Set([...activeCodes, matchedCoupon.code])))
        setMessage("เลือกโค้ดส่วนลดแล้ว ระบบจะนำไปใช้ในขั้นตอนชำระเงิน")
        return true
      }

      const updatedCart = await applyCheckoutPromotionMutation.mutateAsync([
        normalizedCode,
      ])
      const nextCodes = (updatedCart.promotions ?? [])
        .map((promotion) => promotion.code)
        .filter(
          (code): code is string => typeof code === "string" && code.length > 0
        )

      if (!nextCodes.includes(normalizedCode)) {
        setActiveCodes(previousActiveCodes)
        setOptimisticCheckoutPromotionCodes(previousActiveCodes)
        const failedReason = "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
        setError(failedReason)
        setCouponFailure(normalizedCode, failedReason)
        return false
      }

      setMessage("โค้ดส่วนลดถูกใช้แล้ว")
      setManualCode("")
      setActiveCodes(nextCodes)
      setOptimisticCheckoutPromotionCodes(nextCodes)
      return true
    } catch (error: unknown) {
      if (supportsDirectPromotionApply) {
        setActiveCodes(previousActiveCodes)
        setOptimisticCheckoutPromotionCodes(previousActiveCodes)
      }
      // Handle backend error gracefully
      const errorMessage =
        error instanceof Error ? error.message : String(error || "")
      if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("not found")
      ) {
        const failedReason = "คูปองไม่ถูกต้อง หรือหมดอายุแล้ว"
        setError(failedReason)
        setCouponFailure(normalizedCode, failedReason)
      } else {
        const failedReason = "เกิดข้อผิดพลาดในการใช้คูปอง"
        setError(failedReason)
        setCouponFailure(normalizedCode, failedReason)
      }
      console.error("Discount Error:", error)
      return false
    } finally {
      setApplyingCode(null)
    }
  }

  const handleCollect = async (coupon: CouponData) => {
    setCollectingCouponId(coupon.id)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(
        `/api/coupons/${encodeURIComponent(coupon.id)}/collect`,
        {
          method: "POST",
        }
      )

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean
        message?: string
      }

      if (!result.success) {
        const message =
          typeof result.message === "string" && result.message.length > 0
            ? result.message
            : "ไม่สามารถเก็บคูปองได้"

        if (message === "Unauthorized") {
          setError("กรุณาเข้าสู่ระบบก่อนเก็บคูปอง")
        } else {
          setError(message)
        }
        return false
      }

      await queryClient.invalidateQueries({
        queryKey: queryKeys.coupons.all(),
      })
      setMessage("เก็บโค้ดส่วนลดแล้ว")
      return true
    } catch (error) {
      console.error("Collect coupon error:", error)
      setError("ไม่สามารถเก็บคูปองได้")
      return false
    } finally {
      setCollectingCouponId(null)
    }
  }

  const handleRemove = async (codeToRemove: string) => {
    const previousActiveCodes = [...activeCodes]
    setRemovingCode(codeToRemove)
    setError(null)
    setMessage(null)

    try {
      if (supportsDirectPromotionApply) {
        const nextCodes = previousActiveCodes.filter((code) => code !== codeToRemove)
        setMessage("กำลังลบโค้ดส่วนลด…")
        setActiveCodes(nextCodes)
        setOptimisticCheckoutPromotionCodes(nextCodes)
        const updatedCart = await removeCheckoutPromotionMutation.mutateAsync(
          codeToRemove
        )
        const confirmedCodes = (updatedCart.promotions ?? [])
          .map((promotion) => promotion.code)
          .filter(
            (code): code is string =>
              typeof code === "string" && code.length > 0
          )
        setActiveCodes(confirmedCodes)
        setOptimisticCheckoutPromotionCodes(confirmedCodes)
        setMessage("ลบโค้ดส่วนลดแล้ว")
      } else {
        unstagePromotionCode(codeToRemove)
        setMessage("ยกเลิกโค้ดส่วนลดแล้ว")
      }
      setActiveCodes(activeCodes.filter((code) => code !== codeToRemove))
    } catch (e: unknown) {
      if (supportsDirectPromotionApply) {
        setActiveCodes(previousActiveCodes)
        setOptimisticCheckoutPromotionCodes(previousActiveCodes)
      }
      setError("เกิดข้อผิดพลาดในการลบคูปอง")
    } finally {
      setRemovingCode(null)
    }
  }

  const appliedCodes = useMemo(() => new Set(activeCodes), [activeCodes])
  const activePromotions = useMemo(
    () =>
      activeCodes.map((code) => {
        const promotion = appliedPromotions.find((promo) => promo.code === code)
        return {
          id: promotion?.id ?? code,
          code,
        }
      }),
    [activeCodes, appliedPromotions]
  )
  const sortedCoupons = useMemo(() => {
    const preparedCoupons = availableCoupons.map((coupon) => {
      const eligibility = evaluateCouponEligibility(coupon, {
        cart,
        appliedCodes,
        vendorName,
        cartFingerprint: currentCartFingerprint,
      })

      return {
        coupon,
        eligibility,
        failedReason: failedCouponReasons[coupon.code],
      }
    })

    return preparedCoupons.sort((left, right) => {
      const leftEnabled = left.coupon.is_collected
        ? left.eligibility.isEligible && !left.failedReason
        : true
      const rightEnabled = right.coupon.is_collected
        ? right.eligibility.isEligible && !right.failedReason
        : true

      if (leftEnabled !== rightEnabled) {
        return leftEnabled ? -1 : 1
      }

      if (left.coupon.is_collected !== right.coupon.is_collected) {
        return left.coupon.is_collected ? -1 : 1
      }

      if (!!left.coupon.vendorName !== !!right.coupon.vendorName) {
        return left.coupon.vendorName ? -1 : 1
      }

      return left.coupon.code.localeCompare(right.coupon.code, "th")
    })
  }, [
    appliedCodes,
    availableCoupons,
    cart,
    currentCartFingerprint,
    failedCouponReasons,
    vendorName,
  ])

  if (!isOpen) return null

  return (
    <Modal
      header={<span>คูปองส่วนลดของ SOPet</span>}
      onClose={close}
      width={720}
    >
      <div className="px-4 pb-4 flex flex-col gap-4">
        {error && <Text className="text-red-500 text-sm">{error}</Text>}
        {message && <Text className="text-green-600 text-sm">{message}</Text>}
        {(isMutating ||
          isPreparingCouponEligibility ||
          (couponsQuery.isFetching && !isFetchingCoupons)) && (
          <div className="flex items-center gap-2 rounded-lg bg-sop-primary-50 px-3 py-2 text-sop-primary-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <Text className="text-sm">
              {isMutating
                ? "กำลังอัปเดตโค้ดส่วนลด…"
                : isPreparingCouponEligibility
                  ? "กำลังเตรียมเงื่อนไขคูปองล่าสุด…"
                  : "กำลังตรวจสอบคูปองล่าสุด…"}
            </Text>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Text className="text-sm font-medium text-gray-900">
            กรอกโค้ดส่วนลด
          </Text>
          <div className="flex gap-2 items-center">
            <Input
              title=""
              placeholder="กรอกโค้ดคูปอง"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button
              onClick={() => handleApply(manualCode)}
              disabled={isMutating || manualCode.trim().length === 0}
              loading={applyingCode === manualCode.trim()}
              className="shrink-0"
            >
              ใช้โค้ด
            </Button>
          </div>
        </div>

        {/* Applied Coupons Section */}
        {showAppliedPromotions && activePromotions.length > 0 && (
          <div className="flex flex-col gap-2">
            <Text className="text-sm font-medium text-gray-900">
              คูปองที่ใช้อยู่
            </Text>
            {activePromotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-white p-1.5 rounded-full border border-green-100">
                    <Ticket className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <Text className="text-sm font-bold text-green-700">
                      {promo.code}
                    </Text>
                    <Text className="text-xs text-green-600">ใช้งานแล้ว</Text>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(promo.code!)}
                  disabled={isMutating}
                  className="p-1 hover:bg-green-100 rounded-full transition-colors text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="w-full h-px bg-gray-100 my-2" />
          </div>
        )}

        {/* Collected Coupon List */}
        <div className="flex flex-col gap-4">
          <Text className="text-sm font-medium text-gray-900">
            {vendorName ? `คูปองของร้าน ${vendorName}` : "โค้ดส่วนลดของฉัน"}
          </Text>
          {isFetchingCoupons || isPreparingCouponEligibility ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sop-primary-500"></div>
            </div>
          ) : sortedCoupons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
              {sortedCoupons.map(({ coupon, eligibility, failedReason }) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onApply={() =>
                    coupon.is_collected
                      ? handleApply(coupon.code)
                      : handleCollect(coupon)
                  }
                  onConditionsClick={(c) => setSelectedCoupon(c)}
                  isApplied={appliedCodes.has(coupon.code)}
                  isDisabled={
                    coupon.is_collected || appliedCodes.has(coupon.code)
                      ? Boolean(failedReason) || !eligibility.isEligible
                      : false
                  }
                  disabledReason={
                    coupon.is_collected || appliedCodes.has(coupon.code)
                      ? failedReason ?? eligibility.disabledReason
                      : undefined
                  }
                  mode={
                    coupon.is_collected || appliedCodes.has(coupon.code)
                      ? "use"
                      : "collect"
                  }
                  isLoading={
                    applyingCode === coupon.code ||
                    collectingCouponId === coupon.id ||
                    removingCode === coupon.code
                  }
                />
              ))}
            </div>
          ) : (
            <Text className="text-sm text-gray-500 text-center py-4">
              {vendorName
                ? `ร้าน ${vendorName} ยังไม่มีคูปองส่วนลดในขณะนี้`
                : "คุณยังไม่มีคูปองส่วนลดในขณะนี้"}
            </Text>
          )}
        </div>
      </div>

      <CouponConditionsModal
        coupon={selectedCoupon}
        isOpen={!!selectedCoupon}
        onClose={() => setSelectedCoupon(null)}
      />
    </Modal>
  )
}

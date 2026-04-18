"use client"

import { Modal } from "@/components/molecules/Modal/Modal"
import { Button, Input } from "@/components/atoms"
import { Text } from "@medusajs/ui"
import { Ticket, X } from "lucide-react"
import { applyPromotions, deletePromotionCode } from "@/lib/data/cart"
import { Cart } from "@/types/cart"
import {
  startTransition,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react"
import { CouponCard } from "../CouponCard/CouponCard"
import type { CouponData } from "../CouponCard/CouponCard"
import { CouponConditionsModal } from "../CouponConditionsModal/CouponConditionsModal"
import { collectCoupon, fetchCoupons, fetchMyCoupons } from "@/lib/data/coupons"
import { mapCouponToCardData } from "@/lib/utils/coupon-mapper"
import { evaluateCouponEligibility } from "@/lib/helpers/coupon-eligibility"
import { checkoutPaymentFingerprint } from "@/lib/helpers/checkout-payment-fingerprint"
import { useRouter } from "next/navigation"
import { useCartPageUiStore } from "@/lib/zustand/cart-page-ui-store"

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
  const router = useRouter()
  const stagedPromotionCodes = useCartPageUiStore(
    (state) => state.stagedPromotionCodes
  )
  const stagePromotionCode = useCartPageUiStore(
    (state) => state.stagePromotionCode
  )
  const unstagePromotionCode = useCartPageUiStore(
    (state) => state.unstagePromotionCode
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [availableCoupons, setAvailableCoupons] = useState<CouponData[]>([])
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(true)
  const [selectedCoupon, setSelectedCoupon] = useState<CouponData | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [activeCodes, setActiveCodes] = useState<string[]>([])
  const [failedCouponReasons, setFailedCouponReasons] = useState<
    Record<string, string>
  >({})
  const syncedServerStateKeyRef = useRef<string | null>(null)

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
  const supportsDirectPromotionApply =
    typeof cart?.id === "string" && cart.id.startsWith("cart_")

  useEffect(() => {
    if (!isOpen) return

    async function loadCoupons() {
      setIsFetchingCoupons(true)
      try {
        const data = vendorName
          ? await fetchCoupons(undefined, 200, 0, { vendorName })
          : await fetchMyCoupons({
              cartId: cart?.id,
              vendorName,
            })
        setAvailableCoupons(data.map(mapCouponToCardData))
      } catch (e) {
        console.error("Failed to fetch coupons:", e)
      } finally {
        setIsFetchingCoupons(false)
      }
    }
    loadCoupons()
  }, [cart?.id, couponContextKey, isOpen, vendorName])

  useEffect(() => {
    if (!isOpen) {
      syncedServerStateKeyRef.current = null
      return
    }

    const syncKey = `${cart?.id ?? ""}::${vendorName ?? ""}::${serverAppliedCodesKey}`
    if (syncedServerStateKeyRef.current === syncKey) {
      return
    }

    syncedServerStateKeyRef.current = syncKey
    setActiveCodes(
      Array.from(new Set([...serverAppliedCodes, ...stagedPromotionCodes]))
    )
    setFailedCouponReasons({})
    setError(null)
    setMessage(null)
    setManualCode("")
  }, [
    cart?.id,
    isOpen,
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
    setIsLoading(true)
    setError(null)
    setMessage(null)
    if (supportsDirectPromotionApply) {
      setActiveCodes([])
    }
    setFailedCouponReasons((current) => {
      if (!(normalizedCode in current)) {
        return current
      }

      const next = { ...current }
      delete next[normalizedCode]
      return next
    })

    try {
      if (!supportsDirectPromotionApply) {
        if (!matchedCoupon) {
          const failedReason = "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
          setError(failedReason)
          setFailedCouponReasons((current) => ({
            ...current,
            [normalizedCode]: failedReason,
          }))
          return false
        }

        const eligibility = evaluateCouponEligibility(matchedCoupon, {
          cart,
          appliedCodes,
          vendorName,
        })

        if (!eligibility.isEligible) {
          const failedReason =
            eligibility.disabledReason ||
            "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
          setError(failedReason)
          setFailedCouponReasons((current) => ({
            ...current,
            [normalizedCode]: failedReason,
          }))
          return false
        }

        stagePromotionCode(matchedCoupon.code)
        setManualCode("")
        setActiveCodes((current) =>
          Array.from(new Set([...current, matchedCoupon.code]))
        )
        setMessage("เลือกโค้ดส่วนลดแล้ว ระบบจะนำไปใช้ในขั้นตอนชำระเงิน")
        return true
      }

      const result = await applyPromotions([normalizedCode])

      // applyPromotions returns false only when it explicitly fails
      // It may return undefined on success if cart.promotions isn't populated in the response
      if (result === false) {
        const failedReason = "คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน"
        setError(failedReason)
        setFailedCouponReasons((current) => ({
          ...current,
          [normalizedCode]: failedReason,
        }))
        return false
      } else {
        setMessage("โค้ดส่วนลดถูกใช้แล้ว")
        setManualCode("")
        setActiveCodes([normalizedCode])
        startTransition(() => {
          router.refresh()
        })
        return true
      }
    } catch (error: unknown) {
      // Handle backend error gracefully
      const errorMessage =
        error instanceof Error ? error.message : String(error || "")
      if (
        errorMessage.includes("invalid") ||
        errorMessage.includes("not found")
      ) {
        const failedReason = "คูปองไม่ถูกต้อง หรือหมดอายุแล้ว"
        setError(failedReason)
        setFailedCouponReasons((current) => ({
          ...current,
          [normalizedCode]: failedReason,
        }))
      } else {
        const failedReason = "เกิดข้อผิดพลาดในการใช้คูปอง"
        setError(failedReason)
        setFailedCouponReasons((current) => ({
          ...current,
          [normalizedCode]: failedReason,
        }))
      }
      console.error("Discount Error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleCollect = async (coupon: CouponData) => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await collectCoupon(coupon.id)

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

      setAvailableCoupons((current) =>
        current.map((item) =>
          item.id === coupon.id ? { ...item, is_collected: true } : item
        )
      )
      setMessage("เก็บโค้ดส่วนลดแล้ว")
      return true
    } catch (error) {
      console.error("Collect coupon error:", error)
      setError("ไม่สามารถเก็บคูปองได้")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (codeToRemove: string) => {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (supportsDirectPromotionApply) {
        await deletePromotionCode(codeToRemove)
        setMessage("ลบโค้ดส่วนลดแล้ว")
      } else {
        unstagePromotionCode(codeToRemove)
        setMessage("ยกเลิกโค้ดส่วนลดแล้ว")
      }
      setActiveCodes((current) =>
        current.filter((code) => code !== codeToRemove)
      )
      if (supportsDirectPromotionApply) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (e: unknown) {
      setError("เกิดข้อผิดพลาดในการลบคูปอง")
    } finally {
      setIsLoading(false)
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
  }, [appliedCodes, availableCoupons, cart, failedCouponReasons, vendorName])

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
              disabled={isLoading || manualCode.trim().length === 0}
              loading={isLoading}
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
                  disabled={isLoading}
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
          {isFetchingCoupons ? (
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

"use client"

import { useEffect, useMemo, useState } from "react"

import { Button, Input } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import type { CheckoutCoupon } from "@/types/checkout-coupon"
import { cn } from "@/lib/utils"

import {
  categorizeSitePromos,
  findPromoByCode,
  formatPromoDiscountAmount,
  getCartShippingTotalForPromoEstimate,
  getCartSubtotalForPromoEstimate,
  getInitialSelection,
  normalizeCouponCode,
  type SitePromoSelection,
} from "./checkout-site-promotion-utils"
import {
  CollectablePromoCard,
  NoDiscountCard,
  SelectablePromoCard,
  UnavailablePromoCard,
} from "./CheckoutSitePromotionModalCard"

type CheckoutSitePromotionModalProps = {
  isOpen: boolean
  onClose: () => void
  sitePromos: CheckoutCoupon[]
  appliedSitePromo: CheckoutCoupon | null
  isBusy: boolean
  onApplyPromo: (code: string) => Promise<boolean>
  onRemovePromo: () => Promise<boolean>
}

type PromoSectionProps = {
  title: string
  count: number
  children: React.ReactNode
}

function PromoSection({ title, count, children }: PromoSectionProps) {
  if (count === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-sop-12px">
      <h3 className="sop-body-sm-medium text-sop-base-black">
        {title} ({count})
      </h3>
      {children}
    </section>
  )
}

export function CheckoutSitePromotionModal({
  isOpen,
  onClose,
  sitePromos,
  appliedSitePromo,
  isBusy,
  onApplyPromo,
  onRemovePromo,
}: CheckoutSitePromotionModalProps) {
  const cart = useCheckoutStore((state) => state.cart)
  const setSitePromos = useCheckoutStore((state) => state.setSitePromos)

  const [manualCode, setManualCode] = useState("")
  const [selection, setSelection] = useState<SitePromoSelection>(() =>
    getInitialSelection(appliedSitePromo)
  )
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [collectingPromoId, setCollectingPromoId] = useState<string | null>(
    null
  )

  const { available, collectable, unavailable } = useMemo(
    () => categorizeSitePromos(sitePromos),
    [sitePromos]
  )

  const showApplyFooter = available.length > 0 || Boolean(appliedSitePromo)

  const selectedPromo = useMemo(() => {
    if (selection.type !== "promo") {
      return null
    }

    return findPromoByCode(sitePromos, selection.code) ?? null
  }, [selection, sitePromos])

  const footerDiscountLabel = useMemo(() => {
    if (selection.type === "none") {
      return "฿0"
    }

    const selectedCode = selection.type === "promo" ? selection.code : null

    return formatPromoDiscountAmount(selectedPromo, {
      cart,
      selectedCode,
      cartSubtotal: getCartSubtotalForPromoEstimate(cart),
      shippingTotal: getCartShippingTotalForPromoEstimate(cart),
    })
  }, [cart, selectedPromo, selection, sitePromos])

  useEffect(() => {
    if (!isOpen) {
      setManualCode("")
      setError(null)
      setIsConfirming(false)
      setCollectingPromoId(null)
      return
    }

    setSelection(getInitialSelection(appliedSitePromo))
  }, [appliedSitePromo, isOpen])

  const handleApplyManualCode = async () => {
    const normalizedCode = manualCode.trim()
    if (!normalizedCode) {
      return
    }

    setError(null)
    setIsConfirming(true)

    try {
      const applied = await onApplyPromo(normalizedCode)
      if (!applied) {
        setError("คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน")
        return
      }

      setSelection({ type: "promo", code: normalizedCode })
      setManualCode("")
      onClose()
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCollect = async (promo: CheckoutCoupon) => {
    const promoId = String(promo.id ?? "")
    if (!promoId) {
      return
    }

    setCollectingPromoId(promoId)
    setError(null)

    try {
      const response = await fetch(
        `/api/coupons/${encodeURIComponent(promoId)}/collect`,
        { method: "POST" }
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
        setError(
          message === "Unauthorized" ? "กรุณาเข้าสู่ระบบก่อนเก็บคูปอง" : message
        )
        return
      }

      setSitePromos(
        sitePromos.map((item) =>
          String(item.id ?? "") === promoId
            ? { ...item, is_collected: true, is_eligible: true }
            : item
        )
      )
    } catch {
      setError("ไม่สามารถเก็บคูปองได้")
    } finally {
      setCollectingPromoId(null)
    }
  }

  const handleConfirm = async () => {
    if (!showApplyFooter) {
      onClose()
      return
    }

    setError(null)
    setIsConfirming(true)

    try {
      if (selection.type === "none") {
        const removed = await onRemovePromo()
        if (removed) {
          onClose()
        }
        return
      }

      const applied = await onApplyPromo(selection.code)
      if (applied) {
        onClose()
      } else {
        setError("คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน")
      }
    } finally {
      setIsConfirming(false)
    }
  }

  const isActionDisabled = isBusy || isConfirming || Boolean(collectingPromoId)

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      header={
        <h2 className="sop-body-lg-medium text-sop-base-black">
          เลือกส่วนลดแพลตฟอร์ม Sopet
        </h2>
      }
      onClose={onClose}
      width={640}
      footer={
        <div
          className={cn(
            "border-t border-sop-neutral-grayalpha-200 px-sop-16px pb-sop-16px pt-sop-16px",
            showApplyFooter
              ? "flex items-end justify-between gap-sop-16px"
              : "flex justify-center"
          )}
        >
          {showApplyFooter ? (
            <>
              <div className="min-w-0">
                <p className="sop-body-xs-regular text-sop-neutral-gray-400">
                  ส่วนลดที่จะได้รับ
                </p>
                <p className="sop-headline-sm-medium text-sop-system-error-500">
                  {footerDiscountLabel}
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                rounded="full"
                className="shrink-0 px-sop-24px"
                disabled={isActionDisabled}
                loading={isConfirming}
                onClick={() => void handleConfirm()}
              >
                ใช้ส่วนลดนี้
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              rounded="full"
              className="w-full max-w-[320px]"
              disabled={isActionDisabled}
              onClick={onClose}
            >
              ตกลง
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-sop-20px px-sop-16px pb-sop-16px">
        <div className="flex flex-col gap-sop-8px">
          <div className="flex items-stretch gap-sop-8px">
            <div className="min-w-0 flex-1">
              <Input
                hasTitle={false}
                title=""
                variant="flat"
                size="md"
                state={error ? "error" : "default"}
                placeholder="กรอกโค้ดส่วนลด"
                value={manualCode}
                onChange={(event) => {
                  setManualCode(event.target.value)
                  if (error) {
                    setError(null)
                  }
                }}
                disabled={isActionDisabled}
                className="w-full"
                autoComplete="off"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void handleApplyManualCode()
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              rounded="rounded"
              disabled={isActionDisabled || manualCode.trim().length === 0}
              loading={isConfirming && manualCode.trim().length > 0}
              className="shrink-0 border-sop-system-error-500 text-sop-system-error-500 hover:bg-sop-base-white"
              onClick={() => void handleApplyManualCode()}
            >
              ใช้โค้ด
            </Button>
          </div>

          {error ? (
            <p className="sop-body-xs-regular text-sop-system-error-500">
              {error}
            </p>
          ) : null}
        </div>

        {available.length > 0 || showApplyFooter ? (
          <PromoSection title="ใช้ได้ตอนนี้" count={available.length}>
            <div className="grid grid-cols-1 gap-sop-12px sm:grid-cols-2">
              {available.map((promo) => {
                const code = normalizeCouponCode(promo.code)
                const isSelected =
                  selection.type === "promo" &&
                  Boolean(
                    code && selection.code.toLowerCase() === code.toLowerCase()
                  )

                return (
                  <SelectablePromoCard
                    key={String(promo.id ?? code ?? promo.title)}
                    promo={promo}
                    selected={isSelected}
                    onSelect={() => {
                      if (code) {
                        setSelection({ type: "promo", code })
                      }
                    }}
                  />
                )
              })}
              {showApplyFooter ? (
                <NoDiscountCard
                  selected={selection.type === "none"}
                  onSelect={() => setSelection({ type: "none" })}
                />
              ) : null}
            </div>
          </PromoSection>
        ) : null}

        <PromoSection title="เก็บเพิ่มได้" count={collectable.length}>
          <div className="grid grid-cols-1 gap-sop-12px sm:grid-cols-2">
            {collectable.map((promo) => {
              const promoId = String(promo.id ?? "")

              return (
                <CollectablePromoCard
                  key={
                    promoId || normalizeCouponCode(promo.code) || promo.title
                  }
                  promo={promo}
                  isLoading={collectingPromoId === promoId}
                  onCollect={() => void handleCollect(promo)}
                />
              )
            })}
          </div>
        </PromoSection>

        <PromoSection title="ใช้ไม่ได้ตอนนี้" count={unavailable.length}>
          <div className="grid grid-cols-1 gap-sop-12px sm:grid-cols-2">
            {unavailable.map((promo) => (
              <UnavailablePromoCard
                key={String(
                  promo.id ?? normalizeCouponCode(promo.code) ?? promo.title
                )}
                promo={promo}
              />
            ))}
          </div>
        </PromoSection>
      </div>
    </Modal>
  )
}

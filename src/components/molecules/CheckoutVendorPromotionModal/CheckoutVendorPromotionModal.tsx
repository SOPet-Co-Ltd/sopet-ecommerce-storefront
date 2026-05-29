"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/atoms"
import { Modal } from "@/components/molecules/Modal/Modal"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import type { CheckoutCoupon } from "@/types/checkout-coupon"
import { cn } from "@/lib/utils"

import {
  findPromoByCode,
  formatPromoDiscountAmount,
  getCartShippingTotalForPromoEstimate,
  getCartSubtotalForPromoEstimate,
  getInitialSelection,
  normalizeCouponCode,
  type SitePromoSelection,
} from "@/components/molecules/CheckoutSitePromotionModal/checkout-site-promotion-utils"
import {
  NoDiscountCard,
  SelectablePromoCard,
  UnavailablePromoCard,
} from "@/components/molecules/CheckoutSitePromotionModal/CheckoutSitePromotionModalCard"
import { categorizeVendorPromos } from "./checkout-vendor-promotion-utils"

type CheckoutVendorPromotionModalProps = {
  isOpen: boolean
  onClose: () => void
  sellerName: string
  vendorPromos: CheckoutCoupon[]
  appliedVendorPromo: CheckoutCoupon | null
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

export function CheckoutVendorPromotionModal({
  isOpen,
  onClose,
  sellerName,
  vendorPromos,
  appliedVendorPromo,
  isBusy,
  onApplyPromo,
  onRemovePromo,
}: CheckoutVendorPromotionModalProps) {
  const cart = useCheckoutStore((state) => state.cart)

  const [selection, setSelection] = useState<SitePromoSelection>(() =>
    getInitialSelection(appliedVendorPromo)
  )
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const { available, unavailable } = useMemo(
    () => categorizeVendorPromos(vendorPromos),
    [vendorPromos]
  )

  const showApplyFooter = available.length > 0 || Boolean(appliedVendorPromo)

  const selectedPromo = useMemo(() => {
    if (selection.type !== "promo") {
      return null
    }

    return findPromoByCode(vendorPromos, selection.code) ?? null
  }, [selection, vendorPromos])

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
  }, [cart, selectedPromo, selection])

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setIsConfirming(false)
      return
    }

    setSelection(getInitialSelection(appliedVendorPromo))
  }, [appliedVendorPromo, isOpen])

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

  const isActionDisabled = isBusy || isConfirming

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      header={
        <h2 className="sop-body-lg-medium text-sop-base-black">
          ส่วนลดร้านค้า {sellerName}
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

        {error ? (
          <p className="sop-body-xs-regular text-sop-system-error-500">
            {error}
          </p>
        ) : null}

        {available.length === 0 && unavailable.length === 0 ? (
          <p className="sop-body-sm-regular text-sop-neutral-gray-400 py-sop-20px text-center">
            ร้านค้านี้ยังไม่มีส่วนลด
          </p>
        ) : null}
      </div>
    </Modal>
  )
}

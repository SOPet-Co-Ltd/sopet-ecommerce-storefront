"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"

import { Button, Input } from "@/components/atoms"
import { CheckoutSitePromotionModal } from "@/components/molecules/CheckoutSitePromotionModal"
import { useCheckoutStore } from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import {
  useApplyCheckoutPromotionMutation,
  useRemoveCheckoutPromotionMutation,
} from "@/hooks/useDiscountModalCouponsQuery"
import { useCheckoutPromotionsQuery } from "@/hooks/useCheckoutPromotionsQuery"
import { queryKeys } from "@/lib/react-query/query-keys"
import {
  CloseIcon,
  DiscountIcon,
  GreaterThanIcon,
  OutlinePromoIcon,
  PlusIcon,
} from "@/icons"
import {
  buildSitePromoApplyCodes,
  isPromotionCodeOnCart,
  resolveAppliedSitePromo,
} from "@/components/molecules/CheckoutSitePromotionModal/checkout-site-promotion-utils"
import { checkoutPaymentFingerprint } from "@/lib/helpers/checkout-payment-fingerprint"
import type { CheckoutCoupon } from "@/types/checkout-coupon"
import type { Cart } from "@/types/cart"
import { useIsMobile } from "@/lib/utils/is-mobile"
import { cn } from "@/lib/utils"

function normalizeCouponCode(code: string | null | undefined): string | null {
  if (!code) {
    return null
  }

  const trimmed = code.trim()
  return trimmed.length > 0 ? trimmed : null
}

function countUsableSitePromos(sitePromos: CheckoutCoupon[]): number {
  return sitePromos.filter(
    (promo) =>
      !promo.is_used &&
      promo.is_eligible &&
      (!promo.requires_collection || promo.is_collected)
  ).length
}

// Reads cart/promos exclusively from the checkout store — the SSR snapshot
// is hydrated by `CheckoutStoreProvider` so passing them as props would drift.
export function CheckoutPromotionSection() {
  const queryClient = useQueryClient()
  const cart = useCheckoutStore((state) => state.cart)
  const setCart = useCheckoutStore((state) => state.setCart)
  const sitePromos = useCheckoutStore((state) => state.sitePromos)
  const vendorPromos = useCheckoutStore((state) => state.vendorPromos)
  const setSitePromos = useCheckoutStore((state) => state.setSitePromos)
  const setVendorPromos = useCheckoutStore((state) => state.setVendorPromos)
  const isMobile = useIsMobile()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const checkoutCartId =
    typeof cart.id === "string" && cart.id.startsWith("cart_") ? cart.id : null

  const applyPromotionMutation =
    useApplyCheckoutPromotionMutation(checkoutCartId)
  const removePromotionMutation =
    useRemoveCheckoutPromotionMutation(checkoutCartId)

  const appliedSitePromo = useMemo(
    () => resolveAppliedSitePromo(cart, sitePromos, vendorPromos),
    [cart, sitePromos, vendorPromos]
  )

  const setSelectedSitePromoCode = useCheckoutStore(
    (state) => state.setSelectedSitePromoCode
  )

  useEffect(() => {
    setSelectedSitePromoCode(appliedSitePromo?.code ?? null)
  }, [appliedSitePromo?.code, setSelectedSitePromoCode])

  const isApplying = applyPromotionMutation.isPending
  const isRemoving = removePromotionMutation.isPending
  const isBusy = isApplying || isRemoving

  const promotionsFingerprint = useMemo(
    () => checkoutPaymentFingerprint(cart),
    [cart]
  )

  const promotionsQuery = useCheckoutPromotionsQuery({
    cartId: checkoutCartId,
    eligibilityFingerprint: promotionsFingerprint || null,
  })

  useEffect(() => {
    const data = promotionsQuery.data
    if (!data) {
      return
    }

    setSitePromos(data.site)
    setVendorPromos(data.vendor)
  }, [promotionsQuery.data, setSitePromos, setVendorPromos])

  const invalidatePromotionsQuery = () => {
    if (!checkoutCartId) {
      return
    }
    // Match every fingerprint for this cart by querying the shared prefix.
    void queryClient.invalidateQueries({
      queryKey: ["checkout", "promotions", checkoutCartId] as const,
      exact: false,
    })
  }

  const applyPromoCode = async (normalizedCode: string): Promise<boolean> => {
    if (!normalizedCode || !checkoutCartId) {
      return false
    }

    setError(null)

    try {
      const codesToApply = buildSitePromoApplyCodes(
        cart,
        sitePromos,
        vendorPromos,
        normalizedCode
      )
      const updatedCart = await applyPromotionMutation.mutateAsync(codesToApply)
      const applied = isPromotionCodeOnCart(updatedCart, normalizedCode)

      if (!applied) {
        setError("คูปองไม่ถูกต้อง หรือเงื่อนไขไม่ครบถ้วน")
        return false
      }

      setCart(updatedCart)
      invalidatePromotionsQuery()
      return true
    } catch (applyError: unknown) {
      const message =
        applyError instanceof Error
          ? applyError.message
          : "เกิดข้อผิดพลาดในการใช้คูปอง"
      setError(message)
      return false
    }
  }

  const handleApplyManualCode = async () => {
    const normalizedCode = manualCode.trim()
    const applied = await applyPromoCode(normalizedCode)

    if (applied) {
      setManualCode("")
    }
  }

  const handleApplyPromoFromModal = async (code: string) => {
    const applied = await applyPromoCode(code)

    if (applied) {
      setIsModalOpen(false)
    }

    return applied
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)

    if (checkoutCartId) {
      const cachedCart = queryClient.getQueryData<Cart>(
        queryKeys.checkout.cart(checkoutCartId)
      )

      if (cachedCart) {
        setCart(cachedCart)
      }
    }
  }

  const removeAppliedPromo = async (): Promise<boolean> => {
    const code = normalizeCouponCode(appliedSitePromo?.code)
    if (!code || !checkoutCartId) {
      return !appliedSitePromo
    }

    setError(null)

    try {
      const updatedCart = await removePromotionMutation.mutateAsync(code)
      setCart(updatedCart)
      invalidatePromotionsQuery()
      return true
    } catch (removeError: unknown) {
      const message =
        removeError instanceof Error
          ? removeError.message
          : "เกิดข้อผิดพลาดในการลบคูปอง"
      setError(message)
      return false
    }
  }

  const handleRemoveAppliedPromo = async () => {
    await removeAppliedPromo()
  }

  return (
    <>
      <section className="w-full rounded-sop-24px bg-sop-base-white px-sop-16px py-sop-20px lg:px-sop-24px lg:py-sop-20px flex flex-col gap-sop-16px">
        <div className="flex items-center gap-sop-8px">
          <DiscountIcon color="#9C6ADE" size={24} />
          <h2 className="sop-body-md-medium lg:sop-body-lg-medium text-sop-primary-500">
            ส่วนลดแพลตฟอร์ม Sopet
          </h2>
        </div>

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
                disabled={isBusy || !checkoutCartId}
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
              size={isMobile ? "md" : "lg"}
              rounded="rounded"
              disabled={
                isBusy || manualCode.trim().length === 0 || !checkoutCartId
              }
              loading={isApplying}
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

        <PromotionButton
          appliedSitePromo={appliedSitePromo}
          sitePromos={sitePromos}
          isBusy={isBusy}
          disabled={!checkoutCartId}
          onOpenModal={() => setIsModalOpen(true)}
          onRemove={() => void handleRemoveAppliedPromo()}
        />
      </section>

      <CheckoutSitePromotionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        sitePromos={sitePromos}
        appliedSitePromo={appliedSitePromo}
        isBusy={isBusy}
        onApplyPromo={handleApplyPromoFromModal}
        onRemovePromo={removeAppliedPromo}
      />
    </>
  )
}

type PromotionButtonProps = {
  appliedSitePromo: CheckoutCoupon | null
  sitePromos: CheckoutCoupon[]
  isBusy: boolean
  disabled: boolean
  onOpenModal: () => void
  onRemove: () => void
}

function PromotionButton({
  appliedSitePromo,
  sitePromos,
  isBusy,
  disabled,
  onOpenModal,
  onRemove,
}: PromotionButtonProps) {
  const usablePromoCount = useMemo(
    () => countUsableSitePromos(sitePromos),
    [sitePromos]
  )

  if (appliedSitePromo) {
    return (
      <div
        className={cn(
          "grid w-full grid-cols-[auto_1fr_auto] items-center gap-sop-12px",
          "px-sop-12px py-sop-12px lg:px-sop-16px",
          "border border-solid border-sop-neutral-grayalpha-300 rounded-sop-12px"
        )}
      >
        <span className="flex aspect-square shrink-0 items-center justify-center rounded-sop-12 bg-sop-primary-200 p-sop-12px">
          <OutlinePromoIcon color="#884ECF" className="h-sop-24px w-sop-24px" />
        </span>
        <div className="min-w-0">
          <p className="sop-body-sm-medium lg:sop-body-md-medium text-sop-primary-600 line-clamp-1">
            {appliedSitePromo.title}
          </p>
          <p className="sop-body-xs-regular lg:sop-body-sm-regular text-sop-primary-500 line-clamp-2">
            {appliedSitePromo.description}
          </p>
        </div>
        <button
          type="button"
          className="flex h-sop-32px w-sop-32px shrink-0 items-center justify-center rounded-full transition-colors hover:bg-sop-neutral-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="ลบส่วนลดแพลตฟอร์ม"
          disabled={isBusy || disabled}
          onClick={onRemove}
        >
          <CloseIcon color="#949495" className="h-sop-20px w-sop-20px" />
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        "grid w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-sop-12px lg:grid-cols-[auto_1fr_auto]",
        "px-sop-12px py-sop-12px lg:px-sop-16px",
        "border border-dashed border-sop-neutral-orangealpha-300 rounded-sop-12px text-left transition-colors hover:bg-sop-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
      )}
      disabled={isBusy || disabled}
      onClick={onOpenModal}
    >
      <span className="flex aspect-square shrink-0 items-center justify-center rounded-sop-12 bg-sop-primary-200 p-sop-12px">
        <PlusIcon size={24} color="#884ECF" />
      </span>
      <span className="sop-body-sm-regular lg:sop-body-md-regular text-sop-primary-500 line-clamp-1">
        {usablePromoCount > 0
          ? `พบ ${usablePromoCount} ส่วนลดที่ใช้ได้`
          : "เลือกส่วนลดแพลตฟอร์ม"}
      </span>
    </button>
  )
}

"use client"

import { Button } from "@/components/atoms"
import { OutlinePromoIcon } from "@/icons"
import type { CheckoutCoupon } from "@/types/checkout-coupon"
import { cn } from "@/lib/utils"
import { Gift, LockKeyhole, ShoppingBag, Clock } from "lucide-react"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

import {
  formatPromoExpiry,
  formatPromoMinPurchase,
} from "./checkout-site-promotion-utils"

const PROMO_STUB_CLIP_PATH =
  "path('M56 0H0V49C2 49 4 51 4 55C4 59 2 61 0 61V110H56V0Z')"

type PromotionRadioProps = {
  checked: boolean
  disabled?: boolean
}

function PromotionRadio({ checked, disabled }: PromotionRadioProps) {
  return (
    <span
      className={cn(
        "flex h-sop-20px w-sop-20px shrink-0 items-center justify-center rounded-full border-2",
        checked
          ? "border-sop-primary-500 bg-sop-primary-500"
          : "border-sop-neutral-gray-400 bg-sop-base-white",
        disabled && "opacity-60"
      )}
      aria-hidden
    >
      {checked ? (
        <span className="h-sop-8px w-sop-8px rounded-full bg-sop-base-white" />
      ) : null}
    </span>
  )
}

type PromoCardShellProps = {
  selected?: boolean
  dashed?: boolean
  disabled?: boolean
  onClick?: () => void
  left: React.ReactNode
  children: React.ReactNode
  radio?: React.ReactNode
  className?: string
}

function PromoCardShell({
  selected = false,
  dashed = false,
  disabled = false,
  onClick,
  left,
  children,
  radio,
  className,
}: PromoCardShellProps) {
  const Component = onClick ? "button" : "div"

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative grid min-h-27.5 w-full grid-cols-[56px_1fr] overflow-hidden rounded-sop-12px text-left transition-colors",
        selected
          ? "border-2 border-sop-primary-500"
          : dashed
            ? "border border-dashed border-sop-neutral-gray-400"
            : "border border-sop-neutral-grayalpha-300",
        disabled
          ? "cursor-not-allowed opacity-70"
          : onClick && "cursor-pointer",
        className
      )}
    >
      {radio ? (
        <div className="absolute right-sop-12px top-sop-12px z-10">{radio}</div>
      ) : null}
      {left}
      <div className="flex min-w-0 flex-col justify-between bg-sop-base-white px-sop-12px py-sop-12px">
        {children}
      </div>
    </Component>
  )
}

type SelectablePromoCardProps = {
  promo: CheckoutCoupon
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}

export function SelectablePromoCard({
  promo,
  selected,
  disabled,
  onSelect,
}: SelectablePromoCardProps) {
  const expiryLabel = formatPromoExpiry(promo.expiry_date)

  return (
    <PromoCardShell
      selected={selected}
      disabled={disabled}
      onClick={disabled ? undefined : onSelect}
      radio={<PromotionRadio checked={selected} disabled={disabled} />}
      left={
        <div
          className="flex self-stretch items-center justify-center bg-sop-primary-200"
          style={{ clipPath: PROMO_STUB_CLIP_PATH }}
        >
          <OutlinePromoIcon color="#884ECF" className="h-sop-28px w-sop-28px" />
        </div>
      }
    >
      <div>
        <p className="sop-body-sm-medium pr-sop-28px text-sop-system-error-500 line-clamp-2">
          {promo.title}
        </p>
        <p className="sop-body-xs-regular text-sop-neutral-gray-400">
          {formatPromoMinPurchase(promo)}
        </p>
      </div>
      {expiryLabel ? (
        <p className="mt-sop-4px flex items-center gap-sop-4px sop-body-xs-regular text-sop-neutral-gray-400">
          <Clock className="h-sop-14px w-sop-14px shrink-0" aria-hidden />
          <span>หมดอายุ {expiryLabel}</span>
        </p>
      ) : null}
    </PromoCardShell>
  )
}

type NoDiscountCardProps = {
  selected: boolean
  onSelect: () => void
}

export function NoDiscountCard({ selected, onSelect }: NoDiscountCardProps) {
  return (
    <PromoCardShell
      dashed
      selected={selected}
      onClick={onSelect}
      radio={<PromotionRadio checked={selected} />}
      left={
        <div
          className="flex self-stretch items-center justify-center bg-sop-neutral-gray-500"
          style={{ clipPath: PROMO_STUB_CLIP_PATH }}
        >
          <OutlinePromoIcon color="#949495" className="h-sop-28px w-sop-28px" />
        </div>
      }
    >
      <div>
        <p className="sop-body-sm-medium pr-sop-28px text-sop-base-black">
          ไม่ใช้ส่วนลด
        </p>

        <p className="sop-body-xs-regular text-sop-neutral-gray-400">
          ยังไม่ต้องการใช้ส่วนลดในขณะนี้
        </p>
      </div>
    </PromoCardShell>
  )
}

type CollectablePromoCardProps = {
  promo: CheckoutCoupon
  isLoading?: boolean
  onCollect: () => void
}

export function CollectablePromoCard({
  promo,
  isLoading,
  onCollect,
}: CollectablePromoCardProps) {
  return (
    <PromoCardShell
      left={
        <div
          className="flex self-stretch items-center justify-center bg-sop-primary-200"
          style={{ clipPath: PROMO_STUB_CLIP_PATH }}
        >
          <Gift
            className="h-sop-28px w-sop-28px text-sop-primary-500"
            aria-hidden
          />
        </div>
      }
    >
      <div>
        <p className="sop-body-sm-medium text-sop-primary-600 line-clamp-2">
          {promo.title}
        </p>
        <p className="sop-body-xs-regular text-sop-neutral-gray-400 line-clamp-2">
          {promo.description || "ไม่มีขั้นต่ำ เก็บแล้วใช้ได้ทันที"}
        </p>
      </div>
      <div className="mt-sop-8px flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          rounded="rounded"
          loading={isLoading}
          disabled={isLoading}
          className="border-sop-system-error-500 text-sop-system-error-500 hover:bg-sop-base-white"
          onClick={(event) => {
            event.stopPropagation()
            onCollect()
          }}
        >
          เก็บส่วนลด
        </Button>
      </div>
    </PromoCardShell>
  )
}

type UnavailablePromoCardProps = {
  promo: CheckoutCoupon
}

export function UnavailablePromoCard({ promo }: UnavailablePromoCardProps) {
  const requirementText =
    promo.ineligibility_reason ||
    promo.description ||
    formatPromoMinPurchase(promo)

  return (
    <PromoCardShell
      disabled
      className="border-sop-primary-200 bg-sop-primary-100"
      left={
        <div
          className="flex self-stretch items-center justify-center bg-sop-primary-200"
          style={{ clipPath: PROMO_STUB_CLIP_PATH }}
        >
          <LockKeyhole
            className="h-sop-24px w-sop-24px text-sop-primary-500"
            aria-hidden
          />
        </div>
      }
    >
      <div>
        <p className="sop-body-sm-regular text-sop-neutral-gray-400 line-clamp-2">
          {promo.title}
        </p>
        {requirementText ? (
          <p className="sop-body-xs-regular text-sop-system-warning-500 line-clamp-2">
            {requirementText}
          </p>
        ) : null}
      </div>
      <div className="mt-sop-8px flex justify-end">
        <LocalizedClientLink
          href="/cart"
          className="inline-flex items-center gap-sop-4px rounded-sop-8px border border-sop-neutral-grayalpha-300 bg-sop-base-white px-sop-12px py-sop-8px sop-body-xs-medium text-sop-neutral-gray-300"
        >
          <ShoppingBag aria-hidden size={16} />
          ช้อปเพิ่ม
        </LocalizedClientLink>
      </div>
    </PromoCardShell>
  )
}

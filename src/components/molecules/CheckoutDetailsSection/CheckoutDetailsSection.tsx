"use client"

import { convertToLocale } from "@/lib/helpers/money"
import {
  ClipboardListIcon,
  GreaterThanIcon,
  OutlineLogisIcon,
  OutlinePromoIcon,
  ShopIcon,
} from "@/icons"
import type { Cart, ExtendedLineItem, GroupedItems } from "@/types/cart"
import Image from "next/image"
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  useCheckoutStore,
  useVendorShipping,
} from "@/components/sections/CheckoutSection/CheckoutStoreContext"
import {
  useApplyCheckoutPromotionMutation,
  useRemoveCheckoutPromotionMutation,
} from "@/hooks/useDiscountModalCouponsQuery"
import { queryKeys } from "@/lib/react-query/query-keys"
import {
  getCartShippingTotalForPromoEstimate,
  getCartSubtotalForPromoEstimate,
  isPromotionCodeOnCart,
  resolvePromoDiscountAmount,
} from "@/components/molecules/CheckoutSitePromotionModal/checkout-site-promotion-utils"
import {
  buildVendorPromoApplyCodes,
  filterVendorPromosForSeller,
  resolveAppliedVendorPromo,
} from "@/components/molecules/CheckoutVendorPromotionModal/checkout-vendor-promotion-utils"
import { CheckoutVendorPromotionModal } from "@/components/molecules/CheckoutVendorPromotionModal"
import ShippingMethod from "./ShippingMethod"

type SellerGroup = GroupedItems[string]

function getLineItemVariantLabel(item: ExtendedLineItem): string | null {
  const fromOptions = item.variant?.options
    ?.map((opt) => {
      const title = opt.option?.title
      const value = opt.value
      return title && value ? `${title}: ${value}` : value
    })
    .filter(Boolean)
    .join(", ")

  return fromOptions || item.variant_title || item.variant?.title || null
}

function formatAmount(amount: number, currencyCode: string) {
  return convertToLocale({ amount, currency_code: currencyCode })
}

function SellerGroupAction({
  label,
  icon,
  onClick,
  children,
  disabled = false,
}: {
  label: string
  icon: ReactNode
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-w-0 flex-1 cursor-pointer items-center gap-sop-12px grid grid-cols-[auto_1fr_auto] text-left py-[14px] lg:py-0 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex shrink-0" aria-hidden>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col items-start">
        <span className="sop-body-xs-regular lg:sop-body-sm-regular text-sop-neutral-gray-200">
          {label}
        </span>
        {children}
      </span>
      <span className="hidden lg:flex justify-center items-center h-sop-32px w-sop-32px aspect-square">
        <GreaterThanIcon size={20} color="#949495" />
      </span>
    </button>
  )
}

function CheckoutLineItemRow({
  item,
  currencyCode,
}: {
  item: ExtendedLineItem
  currencyCode: string
}) {
  const variantLabel = getLineItemVariantLabel(item)

  return (
    <div className="flex min-w-0 gap-sop-16px lg:gap-sop-20px justify-start">
      <div className="relative aspect-square h-sop-80px w-sop-80px shrink-0 overflow-hidden rounded-sop-8px">
        <Image
          src={item.thumbnail ?? "/images/placeholder.svg"}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="grid w-full min-w-0 grid-cols-1 gap-sop-8px lg:grid-cols-[1fr_auto]">
        <div className="flex min-w-0 flex-col items-start justify-start gap-sop-4px">
          <span className="sop-body-sm-regular lg:sop-body-md-regular text-sop-neutral-gray-300 line-clamp-2">
            {item.title}
          </span>
          {variantLabel ? (
            <p className="sop-body-sm-regular text-sop-neutral-gray-400 min-w-0 w-full wrap-break-word">
              <span className="lg:hidden">ตัวเลือก : </span>
              <span className="hidden lg:inline">ตัวเลือกสินค้า : </span>
              {variantLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-row-reverse items-end justify-between lg:flex-col lg:justify-center">
          <span className="sop-body-sm-regular lg:sop-headline-sm-regular text-sop-neutral-gray-400">
            x{item.quantity}
          </span>
          <span className="sop-body-sm-medium lg:sop-body-lg-medium text-sop-base-black">
            {formatAmount(item.unit_price, currencyCode)}
          </span>
        </div>
      </div>
    </div>
  )
}

function SellerGroupCard({
  cartId,
  group,
  currencyCode,
}: {
  cartId: string
  group: SellerGroup
  currencyCode: string
}) {
  const { seller, items } = group

  const queryClient = useQueryClient()

  const [openShippingModal, setOpenShippingModal] = useState(false)
  const [openDiscountModal, setOpenDiscountModal] = useState(false)

  const cart = useCheckoutStore((state) => state.cart)
  const setCart = useCheckoutStore((state) => state.setCart)
  const vendorPromos = useCheckoutStore((state) => state.vendorPromos)

  const checkoutCartId =
    typeof cart.id === "string" && cart.id.startsWith("cart_") ? cart.id : null

  const sellerVendorPromos = useMemo(
    () => filterVendorPromosForSeller(vendorPromos, seller.name),
    [vendorPromos, seller.name]
  )

  const appliedVendorPromo = useMemo(
    () => resolveAppliedVendorPromo(cart, sellerVendorPromos),
    [cart, sellerVendorPromos]
  )

  const appliedVendorDiscount = useMemo(
    () =>
      appliedVendorPromo
        ? resolvePromoDiscountAmount(appliedVendorPromo, {
            cart,
            cartSubtotal: getCartSubtotalForPromoEstimate(cart),
            shippingTotal: getCartShippingTotalForPromoEstimate(cart),
          })
        : 0,
    [appliedVendorPromo, cart]
  )

  const applyPromotionMutation =
    useApplyCheckoutPromotionMutation(checkoutCartId)
  const removePromotionMutation =
    useRemoveCheckoutPromotionMutation(checkoutCartId)
  const isDiscountBusy =
    applyPromotionMutation.isPending || removePromotionMutation.isPending

  const sellerSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [items]
  )

  const {
    options: shippingOptions,
    isLoading: isLoadingShipping,
    error: shippingError,
  } = useVendorShipping(cartId, seller.id)

  const selectedShippingMethodId = useCheckoutStore(
    (state) => state.selectedShippingMethodBySellerId[seller.id] ?? null
  )
  const setSelectedShippingMethod = useCheckoutStore(
    (state) => state.setSelectedShippingMethod
  )

  useEffect(() => {
    if (!shippingOptions || shippingOptions.length === 0) return
    if (
      selectedShippingMethodId &&
      shippingOptions.some((opt) => opt.id === selectedShippingMethodId)
    ) {
      return
    }
    const first = shippingOptions[0]
    if (first?.id) {
      setSelectedShippingMethod(seller.id, first.id)
    }
  }, [
    shippingOptions,
    selectedShippingMethodId,
    seller.id,
    setSelectedShippingMethod,
  ])

  const formattedSubtotal = formatAmount(sellerSubtotal, currencyCode)

  const invalidatePromotionsQuery = () => {
    if (!checkoutCartId) {
      return
    }
    void queryClient.invalidateQueries({
      queryKey: ["checkout", "promotions", checkoutCartId] as const,
      exact: false,
    })
  }

  const handleApplyVendorPromo = async (code: string): Promise<boolean> => {
    const normalizedCode = code.trim()
    if (!normalizedCode || !checkoutCartId) {
      return false
    }

    try {
      const codesToApply = buildVendorPromoApplyCodes(
        cart,
        sellerVendorPromos,
        normalizedCode
      )
      const updatedCart = await applyPromotionMutation.mutateAsync(codesToApply)

      if (!isPromotionCodeOnCart(updatedCart, normalizedCode)) {
        return false
      }

      setCart(updatedCart)
      invalidatePromotionsQuery()
      return true
    } catch {
      return false
    }
  }

  const handleRemoveVendorPromo = async (): Promise<boolean> => {
    const code = appliedVendorPromo?.code?.trim()
    if (!code || !checkoutCartId) {
      return !appliedVendorPromo
    }

    try {
      const updatedCart = await removePromotionMutation.mutateAsync(code)
      setCart(updatedCart)
      invalidatePromotionsQuery()
      return true
    } catch {
      return false
    }
  }

  const handleCloseDiscountModal = () => {
    setOpenDiscountModal(false)

    if (checkoutCartId) {
      const cachedCart = queryClient.getQueryData<Cart>(
        queryKeys.checkout.cart(checkoutCartId)
      )

      if (cachedCart) {
        setCart(cachedCart)
      }
    }
  }

  const handleOpenShipping = () => {
    if (isLoadingShipping || !shippingOptions?.length) {
      return
    }

    setOpenShippingModal(true)
  }

  const selectedShippingOption = shippingOptions?.find(
    (opt) => opt.id === selectedShippingMethodId
  )

  const shippingActionLabel = isLoadingShipping
    ? "กำลังโหลด..."
    : shippingError
      ? shippingError
      : shippingOptions && shippingOptions.length > 0
        ? `เลือกการจัดส่ง (${shippingOptions.length})`
        : "เลือกการจัดส่ง"

  return (
    <div>
      <label className="sop-body-lg-medium text-sop-primary-500 flex items-center gap-2 mb-sop-12px mt-sop-40px">
        <ClipboardListIcon
          className="fill-sop-primary-500 text-white"
          size={24}
        />
        คำสั่งซื้อสินค้า
      </label>
      <div className="bg-sop-base-white rounded-sop-20px overflow-hidden">
        <div className="lg:px-sop-24px px-sop-16px py-sop-12px flex items-center gap-sop-8px bg-[repeating-linear-gradient(90deg,var(--color-sop-primary-300)_0_12px,transparent_12px_20px)] bg-size-[100%_1px] bg-bottom bg-repeat-x">
          <div className="p-sop-8px lg:w-sop-32px lg:h-sop-32px w-sop-28px h-sop-28px flex items-center justify-center bg-sop-primary-500 rounded-full">
            <ShopIcon size={30} color="white" />
          </div>
          <span className="sop-body-md-medium text-sop-neutral-gray-200">
            {seller.name}
          </span>
          <span className="sop-body-sm-regular text-sop-neutral-gray-200">
            {items.length} ชิ้น
          </span>
        </div>

        <div className="lg:px-sop-24px px-sop-16px lg:pt-sop-28px pt-sop-16px pb-sop-16px lg:pb-sop-20px flex flex-col gap-sop-20px">
          {items.map((item, index) => (
            <Fragment key={item.id}>
              <CheckoutLineItemRow item={item} currencyCode={currencyCode} />
              {index < items.length - 1 ? (
                <div className="h-px w-full bg-sop-neutral-grayalpha-200" />
              ) : null}
            </Fragment>
          ))}
        </div>

        <div className="border-t border-t-sop-neutral-grayalpha-200 lg:mx-sop-24px" />

        <div className="flex px-sop-16px lg:px-sop-24px h-full items-center lg:gap-sop-20px gap-sop-12px lg:pt-sop-20px lg:pb-sop-28px">
          <SellerGroupAction
            label="ส่วนลดร้านค้า"
            onClick={() => setOpenDiscountModal(true)}
            icon={
              <OutlinePromoIcon
                sizeMobile={24}
                sizeDesktop={28}
                color="#8B91F1"
              />
            }
          >
            {appliedVendorPromo ? (
              <span className="sop-body-sm-regular lg:sop-body-md-regular text-sop-system-success-500">
                <span className="lg:hidden">
                  ลด {formatAmount(appliedVendorDiscount, currencyCode)}
                </span>
                <span className="hidden lg:inline">
                  ใช้ส่วนลด {formatAmount(appliedVendorDiscount, currencyCode)}{" "}
                  แล้ว
                </span>
              </span>
            ) : (
              <span className="sop-link-sm-regular lg:sop-link-md-regular text-sop-neutral-gray-400">
                เพิ่มส่วนลดร้านค้า
              </span>
            )}
          </SellerGroupAction>

          <div className="w-px shrink-0 self-stretch bg-sop-neutral-grayalpha-200" />

          <SellerGroupAction
            label="การจัดส่ง"
            onClick={handleOpenShipping}
            disabled={
              isLoadingShipping ||
              Boolean(shippingError) ||
              !shippingOptions?.length
            }
            icon={
              <OutlineLogisIcon
                sizeMobile={24}
                sizeDesktop={28}
                color="#8B91F1"
              />
            }
          >
            <span
              className={
                shippingError
                  ? "sop-link-sm-regular lg:sop-link-md-regular text-sop-system-error-500"
                  : selectedShippingOption
                    ? "sop-body-sm-regular lg:sop-body-md-regular text-sop-system-success-500"
                    : "sop-link-sm-regular lg:sop-link-md-regular text-sop-neutral-gray-400"
              }
            >
              {selectedShippingOption ? (
                <>
                  <span style={{ color: "#000000" }}>
                    {selectedShippingOption.name}
                  </span>{" "}
                  <span style={{ color: "#6E76EE" }}>
                    {formatAmount(
                      selectedShippingOption.amount ?? 0,
                      currencyCode
                    )}
                  </span>
                </>
              ) : (
                shippingActionLabel
              )}
            </span>
          </SellerGroupAction>
          {openShippingModal && (
            <ShippingMethod
              shippingOptions={shippingOptions ?? []}
              selectedShippingMethodId={selectedShippingMethodId ?? ""}
              onClose={() => setOpenShippingModal(false)}
              onSelect={(id) => {
                setSelectedShippingMethod(seller.id, id)
                setOpenShippingModal(false)
              }}
            />
          )}
        </div>

        <div className="px-sop-24px py-sop-12px flex items-center justify-between bg-sop-primary-200">
          <span className="sop-body-md-medium text-sop-neutral-gray-200">
            ยอดรวมร้าน
          </span>
          <span className="sop-body-lg-medium text-sop-neutral-gray-200">
            {formattedSubtotal}
          </span>
        </div>
      </div>

      <CheckoutVendorPromotionModal
        isOpen={openDiscountModal}
        onClose={handleCloseDiscountModal}
        sellerName={seller.name}
        vendorPromos={sellerVendorPromos}
        appliedVendorPromo={appliedVendorPromo}
        isBusy={isDiscountBusy}
        onApplyPromo={handleApplyVendorPromo}
        onRemovePromo={handleRemoveVendorPromo}
      />
    </div>
  )
}

const CheckoutDetailsSection = ({ cart }: { cart: Cart }) => {
  const currencyCode = cart.region?.currency_code ?? cart.currency_code

  const storeSellerGroups = useCheckoutStore((state) => state.sellerGroups)

  return Object.entries(storeSellerGroups).map(
    ([key, group]: [string, GroupedItems[string]]) => (
      <SellerGroupCard
        key={key}
        cartId={cart.id}
        group={group}
        currencyCode={currencyCode}
      />
    )
  )
}

export default CheckoutDetailsSection

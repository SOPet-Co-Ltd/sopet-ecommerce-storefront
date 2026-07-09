/**
 * Client-side checkout state (Zustand vanilla store).
 *
 * Holds SSR-hydrated checkout data (cart, customer, promos, platform shipping)
 * plus per-vendor shipping options loaded on demand in the checkout UI.
 * Use via `CheckoutStoreProvider` / `useCheckoutStore` — not as a global singleton.
 */
import type { HttpTypes } from "@medusajs/types"
import { createStore } from "zustand/vanilla"

import type {
  Cart,
  ExtendedLineItem,
  GroupedItems,
  StoreCardShippingMethod,
} from "@/types/cart"
import type { CheckoutCoupon } from "@/types/checkout-coupon"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { getShippingAddressFingerprint } from "@/lib/checkout/address-to-cart-shipping"
import { fetchVendorShippingMethods } from "@/lib/checkout/fetch-vendor-shipping"
import { ensureCheckoutShippingAddressSynced } from "@/lib/checkout/sync-shipping-address-client"
import { resolveVendorShippingSellerId } from "@/lib/checkout/resolve-vendor-shipping-seller-id"
import { getCartItemSellerGroup } from "@/lib/helpers/cart-seller"
import {
  checkoutPayloadSchema,
  type CheckoutPayload,
  type CheckoutPaymentMethod,
  type NewCardDraft,
} from "@/lib/checkout/checkout-payload-schema"
import type { CheckoutAddressFormData } from "@/components/molecules/AddressForm/schema"
import type { z } from "zod"

/** Async fetch state for one marketplace seller's shipping methods. */
export type VendorShippingState = {
  options: StoreCardShippingMethod[] | null
  isLoading: boolean
  error: string | null
}

const DEFAULT_VENDOR_SHIPPING: VendorShippingState = {
  options: null,
  isLoading: false,
  error: null,
}

// Module-level counters so in-flight fetches can be ignored after unmount or seller change.
const vendorShippingLoadGeneration = new Map<string, number>()

function bumpVendorShippingGeneration(sellerId: string) {
  const next = (vendorShippingLoadGeneration.get(sellerId) ?? 0) + 1
  vendorShippingLoadGeneration.set(sellerId, next)
  return next
}

function isVendorShippingLoadStale(sellerId: string, generation: number) {
  return vendorShippingLoadGeneration.get(sellerId) !== generation
}

const VENDOR_SHIPPING_FETCH_MAX_ATTEMPTS = 3
const VENDOR_SHIPPING_FETCH_RETRY_DELAY_MS = 400

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function seedVendorShippingFromPlatformMethods(
  shippingMethods: StoreCardShippingMethod[]
): Record<string, VendorShippingState> {
  const optionsBySellerId = shippingMethods.reduce<
    Record<string, StoreCardShippingMethod[]>
  >((groups, method) => {
    const sellerId = method.seller_id?.trim()
    if (!sellerId) {
      return groups
    }

    groups[sellerId] ??= []
    groups[sellerId].push(method)
    return groups
  }, {})

  return Object.fromEntries(
    Object.entries(optionsBySellerId).map(([sellerId, options]) => [
      sellerId,
      {
        options,
        isLoading: false,
        error: null,
      } satisfies VendorShippingState,
    ])
  )
}

async function fetchVendorShippingMethodsWithRetry(
  cartId: string,
  sellerId: string,
  isStale: () => boolean
): Promise<StoreCardShippingMethod[] | null> {
  for (
    let attempt = 0;
    attempt < VENDOR_SHIPPING_FETCH_MAX_ATTEMPTS;
    attempt++
  ) {
    if (attempt > 0) {
      await sleep(VENDOR_SHIPPING_FETCH_RETRY_DELAY_MS * attempt)
    }

    if (isStale()) {
      return null
    }

    const options = await fetchVendorShippingMethods(cartId, sellerId)
    if (options !== null) {
      return options
    }
  }

  return null
}

function setVendorShippingEntry(
  sellerId: string,
  patch: Partial<VendorShippingState>
) {
  return (
    state: CheckoutState
  ): Pick<CheckoutState, "vendorShippingBySellerId"> => ({
    vendorShippingBySellerId: {
      ...state.vendorShippingBySellerId,
      [sellerId]: {
        ...(state.vendorShippingBySellerId[sellerId] ??
          DEFAULT_VENDOR_SHIPPING),
        ...patch,
      },
    },
  })
}

/** Group cart line items by seller for per-vendor checkout UI. */
function groupCartItemsBySeller(cart: Cart): GroupedItems {
  return (cart.items ?? []).reduce<GroupedItems>((groups, item) => {
    const extendedItem = item as ExtendedLineItem
    const { key, seller } = getCartItemSellerGroup(extendedItem)

    if (!key || !seller) {
      return groups
    }

    groups[key] ??= { seller, items: [] }
    groups[key].items.push(extendedItem)
    return groups
  }, {})
}

type CheckoutState = {
  cart: Cart
  customer: HttpTypes.StoreCustomer | null
  customerAddresses: HttpTypes.StoreCustomerAddress[]
  customerCards: CustomerPaymentMethod[]
  /** Platform-wide shipping methods from checkout page SSR. */
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  sitePromos: CheckoutCoupon[]
  vendorPromos: CheckoutCoupon[]
  error: string | null
  /** Cart lines keyed by seller — drives per-vendor checkout sections. */
  sellerGroups: GroupedItems
  /** Per-seller shipping options; populated by `loadVendorShippingOptions`. */
  vendorShippingBySellerId: Record<string, VendorShippingState>

  // UI selections (client-only).
  paymentMethod: CheckoutPaymentMethod
  selectedCardId: string | null
  newCardDraft: NewCardDraft | null
  shippingAddress: CheckoutAddressFormData | null
  billingContactOverride: { phone?: string; email?: string } | null
  selectedShippingMethodBySellerId: Record<string, string>
  selectedSitePromoCode: string | null
  saveShippingAddress: boolean

  // Form validation triggers (registered by form components).
  addressFormTrigger: (() => Promise<boolean>) | null
  paymentFormTrigger: (() => Promise<boolean>) | null

  /** Shared across desktop + mobile checkout submit buttons. */
  isSubmitting: boolean
}

type CheckoutActions = {
  setCart: (cart: Cart) => void
  setCustomer: (customer: HttpTypes.StoreCustomer | null) => void
  setCustomerAddresses: (addresses: HttpTypes.StoreCustomerAddress[]) => void
  setShippingMethods: (methods: StoreCardShippingMethod[]) => void
  setPaymentMethods: (methods: HttpTypes.StorePaymentProvider[] | null) => void
  setSitePromos: (promos: CheckoutCoupon[]) => void
  setVendorPromos: (promos: CheckoutCoupon[]) => void
  setError: (error: string | null) => void
  getVendorShipping: (sellerId: string) => VendorShippingState
  loadVendorShippingOptions: (cartId: string, sellerId: string) => Promise<void>
  abortVendorShippingLoad: (sellerId: string) => void

  setPaymentMethod: (method: CheckoutPaymentMethod) => void
  setSelectedCardId: (id: string | null) => void
  setNewCardDraft: (draft: NewCardDraft | null) => void
  setShippingAddress: (address: CheckoutAddressFormData | null) => void
  setBillingContactOverride: (
    override: { phone?: string; email?: string } | null
  ) => void
  setSelectedShippingMethod: (sellerId: string, optionId: string) => void
  setSelectedSitePromoCode: (code: string | null) => void
  setSaveShippingAddress: (save: boolean) => void
  setAddressFormTrigger: (trigger: (() => Promise<boolean>) | null) => void
  setPaymentFormTrigger: (trigger: (() => Promise<boolean>) | null) => void
  setIsSubmitting: (isSubmitting: boolean) => void
  resetCheckout: () => void
  buildCheckoutPayload: () => unknown
  validateCheckoutPayload: () =>
    | { success: true; data: CheckoutPayload }
    | { success: false; error: z.ZodError }
}

export type CheckoutStore = CheckoutState & CheckoutActions

/** Props passed from the checkout page server component into `createCheckoutStore`. */
export type CheckoutStoreInitialProps = {
  cart: Cart
  customer: HttpTypes.StoreCustomer | null
  customerAddresses: HttpTypes.StoreCustomerAddress[]
  customerCards: CustomerPaymentMethod[]
  shippingMethods: StoreCardShippingMethod[]
  paymentMethods: HttpTypes.StorePaymentProvider[] | null
  sitePromos: CheckoutCoupon[]
  vendorPromos: CheckoutCoupon[]
  error: string | null
}

/** Factory for one checkout-scoped store instance (created inside the provider). */
export function createCheckoutStore(initial: CheckoutStoreInitialProps) {
  return createStore<CheckoutStore>((set, get) => ({
    ...initial,
    vendorShippingBySellerId: seedVendorShippingFromPlatformMethods(
      initial.shippingMethods
    ),

    paymentMethod: "promptpay",
    selectedCardId: null,
    newCardDraft: null,
    shippingAddress: null,
    billingContactOverride: null,
    selectedShippingMethodBySellerId: {},
    selectedSitePromoCode: null,
    saveShippingAddress: false,
    addressFormTrigger: null,
    paymentFormTrigger: null,
    isSubmitting: false,

    setCart: (cart) => set({ cart }),
    setCustomer: (customer) => set({ customer }),
    setCustomerAddresses: (customerAddresses) => set({ customerAddresses }),
    setShippingMethods: (shippingMethods) => set({ shippingMethods }),
    setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
    setSitePromos: (sitePromos) => set({ sitePromos }),
    setVendorPromos: (vendorPromos) => set({ vendorPromos }),
    setError: (error) => set({ error }),

    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
    setSelectedCardId: (selectedCardId) => set({ selectedCardId }),
    setNewCardDraft: (newCardDraft) => set({ newCardDraft }),
    setShippingAddress: (shippingAddress) =>
      set((state) => {
        if (!shippingAddress) {
          return state.shippingAddress === null
            ? state
            : { shippingAddress: null }
        }

        if (!state.shippingAddress) {
          return { shippingAddress }
        }

        const nextFingerprint = getShippingAddressFingerprint(shippingAddress)
        const currentFingerprint = getShippingAddressFingerprint(
          state.shippingAddress
        )

        return nextFingerprint === currentFingerprint
          ? state
          : { shippingAddress }
      }),
    setBillingContactOverride: (billingContactOverride) =>
      set({ billingContactOverride }),
    setSelectedShippingMethod: (sellerId, optionId) =>
      set((state) => ({
        selectedShippingMethodBySellerId: {
          ...state.selectedShippingMethodBySellerId,
          [sellerId]: optionId,
        },
      })),
    setSelectedSitePromoCode: (selectedSitePromoCode) =>
      set({ selectedSitePromoCode }),
    setSaveShippingAddress: (saveShippingAddress) =>
      set({ saveShippingAddress }),
    setAddressFormTrigger: (addressFormTrigger) => set({ addressFormTrigger }),
    setPaymentFormTrigger: (paymentFormTrigger) => set({ paymentFormTrigger }),
    setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
    resetCheckout: () =>
      set({
        paymentMethod: "promptpay",
        selectedCardId: null,
        newCardDraft: null,
        shippingAddress: null,
        billingContactOverride: null,
        selectedShippingMethodBySellerId: {},
        selectedSitePromoCode: null,
        saveShippingAddress: false,
        isSubmitting: false,
      }),
    buildCheckoutPayload: () => {
      const state = get()
      const cart = state.cart
      const customer = state.customer
      const shipping = state.shippingAddress
      const override = state.billingContactOverride ?? {}

      // Billing defaults to shipping; only phone/email may be overridden.
      const billing: CheckoutAddressFormData | null = shipping
        ? {
            ...shipping,
            phone:
              override.phone && override.phone.trim().length > 0
                ? override.phone
                : shipping.phone,
            email:
              override.email && override.email.trim().length > 0
                ? override.email
                : shipping.email,
          }
        : null

      const customerSession = customer
        ? {
            mode: "logged_in" as const,
            customerId: customer.id,
            email: customer.email ?? shipping?.email ?? "",
          }
        : {
            mode: "guest" as const,
            email: shipping?.email,
          }

      const shippingMethods = Object.entries(
        state.selectedShippingMethodBySellerId
      ).map(([sellerId, optionId]) => ({ sellerId, optionId }))

      // `card` without a selected saved card emits a bare object; the schema's
      // refine will reject it with a meaningful error until either a saved card
      // is chosen or `useCheckoutSubmit` mints an omiseToken from the new-card draft.
      const payment =
        state.paymentMethod === "promptpay"
          ? { method: "promptpay" as const }
          : state.selectedCardId
            ? {
                method: "card" as const,
                customerPaymentMethodId: state.selectedCardId,
              }
            : { method: "card" as const }

      const appliedSitePromoCodes = (cart.promotions ?? [])
        .map((p) => p.code)
        .filter((c): c is string => typeof c === "string" && c.length > 0)

      return {
        cart: {
          id: cart.id,
          region_id: cart.region_id ?? cart.region?.id ?? null,
          currency_code: cart.region?.currency_code ?? cart.currency_code,
          email: cart.email ?? null,
          items: (cart.items ?? []).map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            product_id: item.product_id ?? null,
            variant_id: item.variant_id ?? null,
            title: item.title ?? null,
          })),
          subtotal: (cart as { subtotal?: number | null }).subtotal ?? null,
          shipping_total: cart.shipping_total ?? null,
          discount_total: cart.discount_total ?? null,
          total: cart.total ?? null,
        },
        customerSession,
        shippingAddress: shipping,
        billingAddress: billing,
        shippingMethods,
        payment,
        coupons: {
          site: state.selectedSitePromoCode,
          vendor: {} as Record<string, string[]>,
        },
        promotions: {
          site: appliedSitePromoCodes,
          vendor: [],
        },
      }
    },
    validateCheckoutPayload: () => {
      const payload = get().buildCheckoutPayload()
      const result = checkoutPayloadSchema.safeParse(payload)
      if (result.success) {
        return { success: true, data: result.data }
      }
      return { success: false, error: result.error }
    },

    sellerGroups: groupCartItemsBySeller(initial.cart),
    getVendorShipping: (sellerId) =>
      get().vendorShippingBySellerId[sellerId] ?? DEFAULT_VENDOR_SHIPPING,

    /** Invalidate in-flight loads (e.g. when `useVendorShipping` unmounts). */
    abortVendorShippingLoad: (sellerId) => {
      bumpVendorShippingGeneration(sellerId)
    },

    /** Fetches `/store/shipping-options/vendor` and updates `vendorShippingBySellerId`. */
    loadVendorShippingOptions: async (cartId, sellerId) => {
      const generation = bumpVendorShippingGeneration(sellerId)
      const previousEntry =
        get().vendorShippingBySellerId[sellerId] ?? DEFAULT_VENDOR_SHIPPING
      const isStale = () => isVendorShippingLoadStale(sellerId, generation)

      set(
        setVendorShippingEntry(sellerId, {
          isLoading: true,
          error: null,
          options: previousEntry.options,
        })
      )

      try {
        const resolvedSellerId = resolveVendorShippingSellerId(
          get().sellerGroups,
          sellerId
        )

        if (!resolvedSellerId) {
          if (isStale()) {
            return
          }

          set(
            setVendorShippingEntry(sellerId, {
              options: [],
              isLoading: false,
              error: "ไม่มีตัวเลือกการจัดส่งสำหรับร้านค้านี้",
            })
          )
          return
        }

        const shippingAddress = get().shippingAddress

        if (!shippingAddress) {
          if (isStale()) {
            return
          }

          set(
            setVendorShippingEntry(sellerId, {
              options: previousEntry.options,
              isLoading: false,
              error: previousEntry.options?.length
                ? null
                : "กรุณากรอกที่อยู่จัดส่งก่อนเลือกวิธีจัดส่ง",
            })
          )
          return
        }

        let synced = false
        for (
          let attempt = 0;
          attempt < VENDOR_SHIPPING_FETCH_MAX_ATTEMPTS;
          attempt++
        ) {
          if (attempt > 0) {
            await sleep(VENDOR_SHIPPING_FETCH_RETRY_DELAY_MS * attempt)
          }

          if (isStale()) {
            return
          }

          synced = await ensureCheckoutShippingAddressSynced(
            cartId,
            shippingAddress
          )

          if (synced) {
            break
          }
        }

        if (!synced) {
          if (isStale()) {
            return
          }

          set(
            setVendorShippingEntry(sellerId, {
              options: previousEntry.options,
              isLoading: false,
              error: previousEntry.options?.length
                ? null
                : "ไม่สามารถโหลดตัวเลือกการจัดส่งได้",
            })
          )
          return
        }

        const options = await fetchVendorShippingMethodsWithRetry(
          cartId,
          resolvedSellerId,
          isStale
        )

        // Drop result if a newer load or abort happened while awaiting the API.
        if (isStale()) {
          return
        }

        if (options === null) {
          set(
            setVendorShippingEntry(sellerId, {
              options: previousEntry.options,
              isLoading: false,
              error: previousEntry.options?.length
                ? null
                : "ไม่สามารถโหลดตัวเลือกการจัดส่งได้",
            })
          )
          return
        }

        set(
          setVendorShippingEntry(sellerId, {
            options,
            isLoading: false,
            error:
              options.length === 0
                ? "ไม่มีตัวเลือกการจัดส่งสำหรับร้านค้านี้"
                : null,
          })
        )
      } catch {
        if (isStale()) {
          return
        }

        set(
          setVendorShippingEntry(sellerId, {
            options: previousEntry.options,
            isLoading: false,
            error: previousEntry.options?.length
              ? null
              : "ไม่สามารถโหลดตัวเลือกการจัดส่งได้",
          })
        )
      }
    },
  }))
}

export type CheckoutStoreApi = ReturnType<typeof createCheckoutStore>

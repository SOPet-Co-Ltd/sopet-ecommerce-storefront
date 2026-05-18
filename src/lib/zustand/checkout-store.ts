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
import type { CouponData } from "@/lib/data/checkout-page"
import type { CustomerPaymentMethod } from "@/lib/data/customer"
import { listVendorShippingMethods } from "@/lib/data/fulfillment"
import { getCartItemSellerGroup } from "../helpers/cart-seller"

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
  sitePromos: CouponData[]
  vendorPromos: CouponData[]
  error: string | null
  /** Cart lines keyed by seller — drives per-vendor checkout sections. */
  sellerGroups: GroupedItems
  /** Per-seller shipping options; populated by `loadVendorShippingOptions`. */
  vendorShippingBySellerId: Record<string, VendorShippingState>

  /* =========================
   * ✅ ADDED: selected payment method (UI state)
   * ========================= */
  paymentMethod: string
}

type CheckoutActions = {
  setCart: (cart: Cart) => void
  setCustomer: (customer: HttpTypes.StoreCustomer | null) => void
  setCustomerAddresses: (addresses: HttpTypes.StoreCustomerAddress[]) => void
  setShippingMethods: (methods: StoreCardShippingMethod[]) => void
  setPaymentMethods: (methods: HttpTypes.StorePaymentProvider[] | null) => void
  setSitePromos: (promos: CouponData[]) => void
  setVendorPromos: (promos: CouponData[]) => void
  setError: (error: string | null) => void
  getVendorShipping: (sellerId: string) => VendorShippingState
  loadVendorShippingOptions: (cartId: string, sellerId: string) => Promise<void>
  abortVendorShippingLoad: (sellerId: string) => void

  /* =========================
   * ✅ ADDED: setter for selected payment method
   * ========================= */
  setPaymentMethod: (method: string) => void
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
  sitePromos: CouponData[]
  vendorPromos: CouponData[]
  error: string | null
}

/** Factory for one checkout-scoped store instance (created inside the provider). */
export function createCheckoutStore(initial: CheckoutStoreInitialProps) {
  return createStore<CheckoutStore>((set, get) => ({
    ...initial,
    vendorShippingBySellerId: {},

    /* =========================
     * ✅ ADDED INIT VALUE
     * ========================= */
    paymentMethod: "promptpay",

    setCart: (cart) => set({ cart }),
    setCustomer: (customer) => set({ customer }),
    setCustomerAddresses: (customerAddresses) => set({ customerAddresses }),
    setShippingMethods: (shippingMethods) => set({ shippingMethods }),
    setPaymentMethods: (paymentMethods) => set({ paymentMethods }),
    setSitePromos: (sitePromos) => set({ sitePromos }),
    setVendorPromos: (vendorPromos) => set({ vendorPromos }),
    setError: (error) => set({ error }),

    /* =========================
     * ✅ ADDED ACTION
     * ========================= */
    setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

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

      set(setVendorShippingEntry(sellerId, { isLoading: true, error: null }))

      try {
        const options = await listVendorShippingMethods(cartId, sellerId)

        // Drop result if a newer load or abort happened while awaiting the API.
        if (isVendorShippingLoadStale(sellerId, generation)) {
          return
        }

        if (options === null) {
          set(
            setVendorShippingEntry(sellerId, {
              options: null,
              isLoading: false,
              error: "ไม่สามารถโหลดตัวเลือกการจัดส่งได้",
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
        if (isVendorShippingLoadStale(sellerId, generation)) {
          return
        }

        set(
          setVendorShippingEntry(sellerId, {
            options: null,
            isLoading: false,
            error: "ไม่สามารถโหลดตัวเลือกการจัดส่งได้",
          })
        )
      }
    },
  }))
}

export type CheckoutStoreApi = ReturnType<typeof createCheckoutStore>

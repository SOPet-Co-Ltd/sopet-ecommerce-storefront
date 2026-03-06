import React from "react"
import { Cash, CreditCard } from "@medusajs/icons"
import {
  IconProps,
  UserManagementBellIcon,
  UserManagementBinIcon,
  UserManagementCardIcon,
  UserManagementClipboardIcon,
  UserManagementHeartIcon,
  UserManagementHelpIcon,
  UserManagementLocationIcon,
  UserManagementUserIcon,
} from "@/icons"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  "stripe-connect": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_card_stripe-connect": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <CreditCard />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <CreditCard />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <CreditCard />,
  },
  pp_system_default: {
    title: "Manual Payment",
    icon: <Cash />,
  },
  "pp_promptpay_stripe-promptpay-connect": {
    title: "PromptPay",
    icon: <Cash />,
  },
  // Unified provider mappings - handles both card and promptpay
  "pp_stripe-connect_stripe-connect": {
    title: "Stripe",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe for card payments, it ignores the other stripe-based providers
export const isStripe = (providerId?: string) => {
  if (!providerId) {
    return false
  }

  return (
    providerId === "stripe" ||
    providerId === "stripe-connect" ||
    providerId === "pp_card_stripe-connect" ||
    providerId.startsWith("pp_card_stripe-connect") ||
    providerId.startsWith("pp_card_stripe") ||
    providerId.startsWith("pp_stripe_stripe")
  )
}
export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]

/** Paths under [locale] that require an authenticated customer (e.g. /user, /user/orders). */
export const PROTECTED_ROUTES = ["/user"]

/** Paths under [locale] that authenticated customers must not access (redirect to account). */
export const GUEST_ONLY_ROUTES = ["/login", "/register"]

export type UserSegmentConfig = {
  label: string
  icon: (props: IconProps) => React.JSX.Element
  routes?: Record<
    string,
    {
      label: string
      pattern?: {
        type: "prefix" | "regex"
        value: string
      }
    }
  >
}

export const USER_SEGMENT_LABELS: Record<string, UserSegmentConfig> = {
  profile: {
    label: "ข้อมูลส่วนตัว",
    icon: UserManagementUserIcon,
    routes: {
      "email/change": {
        label: "เปลี่ยนอีเมล",
      },
      "email/add": {
        label: "อีเมลใหม่",
      },
      "phone/change": {
        label: "เปลี่ยนเบอร์โทรศัพท์",
      },
      "phone/add": {
        label: "เพิ่มเบอร์โทรศัพท์",
      },
    },
  },
  orders: {
    label: "คำสั่งซื้อสินค้า",
    icon: UserManagementClipboardIcon,
    routes: {
      "[id]": {
        label: "รายละเอียดคำสั่งซื้อ",
        pattern: {
          type: "prefix",
          value: "order_",
        },
      },
    },
  },
  addresses: {
    label: "ที่อยู่สำหรับจัดส่ง",
    icon: UserManagementLocationIcon,
    routes: {
      new: {
        label: "เพิ่มที่อยู่",
      },
      edit: {
        label: "แก้ไขที่อยู่",
      },
    },
  },
  credit: {
    label: "บัตรเครดิต/เดบิต",
    icon: UserManagementCardIcon,
    routes: {
      add: {
        label: "เพิ่มบัตรเครดิต/เดบิต",
      },
    },
  },
  notifications: {
    label: "การแจ้งเตือน",
    icon: UserManagementBellIcon,
  },
  favorites: {
    label: "รายการโปรด",
    icon: UserManagementHeartIcon,
  },
  help: {
    label: "ศูนย์ช่วยเหลือ",
    icon: UserManagementHelpIcon,
  },
  delete: {
    label: "คำขอลบบัญชี",
    icon: UserManagementBinIcon,
  },
}

/**
 * PATTERN MATCHING GUIDE for Route Breadcrumbs
 *
 * The route breadcrumb system supports parameterized route matching using patterns.
 * This allows you to handle dynamic routes like [id] with automatic label resolution.
 *
 * SYNTAX:
 * - Use bracket notation [paramName] for parameterized route keys
 * - Define a pattern object with type and value
 *
 * PATTERN TYPES:
 * 1. Prefix matching: pattern: { type: "prefix", value: "order_" }
 *    - Matches if segment STARTS WITH the prefix value
 *    - Example: "order_12345" matches "order_"
 *    - Use case: IDs with consistent prefixes
 *
 * 2. Regex matching: pattern: { type: "regex", value: "^order_[0-9]+$" }
 *    - Matches if segment MATCHES the regex pattern
 *    - Example: "order_123" matches "^order_[0-9]+$"
 *    - Use case: Complex ID formats or specific patterns
 *
 * PRIORITY:
 * - Exact matches have priority over patterns
 * - If a route key exactly matches the remaining path, patterns are ignored
 * - Example: if routes has both "edit" and "[id]", "edit" won't trigger pattern matching
 *
 * EXAMPLES:
 * Example 1 - Simple prefix pattern (Orders with order_ prefix):
 * routes: {
 *   "[id]": {
 *     label: "Order Details",
 *     pattern: { type: "prefix", value: "order_" }
 *   }
 * }
 * URL: /user/orders/order_12345 → Shows "Order Details"
 *
 * Example 2 - Regex pattern (User IDs):
 * routes: {
 *   "[userId]": {
 *     label: "User Profile",
 *     pattern: { type: "regex", value: "^[0-9a-f]{8}-[0-9a-f]{4}" }
 *   }
 * }
 * URL: /user/connections/550e8400-e29b-41d4-a716-446655440000 → Shows "User Profile"
 *
 * Example 3 - Digits only (Product IDs):
 * routes: {
 *   "[productId]": {
 *     label: "Product Details",
 *     pattern: { type: "regex", value: "^[0-9]+$" }
 *   }
 * }
 * URL: /user/favorites/123456 → Shows "Product Details"
 */

/** Path suffixes to hide from breadcrumbs (e.g. "phone/change", "new"). Current path is shortened by removing the matching suffix. */
export const USER_BREADCRUMB_HIDDEN_SUFFIXES: string[] = []

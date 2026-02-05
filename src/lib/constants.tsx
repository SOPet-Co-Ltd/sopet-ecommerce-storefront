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

export const PROTECTED_ROUTES = ["/user"]

export type UserSegmentConfig = {
  label: string
  icon: (props: IconProps) => React.JSX.Element
  routes?: Record<string, { label: string }>
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

/** Path suffixes to hide from breadcrumbs (e.g. "phone/change", "new"). Current path is shortened by removing the matching suffix. */
export const USER_BREADCRUMB_HIDDEN_SUFFIXES: string[] = []

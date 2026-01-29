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
  return providerId?.startsWith("pp_card_stripe-connect")
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

export const USER_SEGMENT_LABELS: Record<
  string,
  { label: string; icon: (props: IconProps) => React.JSX.Element }
> = {
  profile: {
    label: "ข้อมูลส่วนตัว",
    icon: UserManagementUserIcon,
  },
  orders: {
    label: "คำสั่งซื้อสินค้า",
    icon: UserManagementClipboardIcon,
  },
  addresses: {
    label: "ที่อยู่สำหรับจัดส่ง",
    icon: UserManagementLocationIcon,
  },
  credit: {
    label: "บัตรเครดิต/เดบิต",
    icon: UserManagementCardIcon,
  },
  notifications: {
    label: "การแจ้งเตือน",
    icon: UserManagementBellIcon,
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

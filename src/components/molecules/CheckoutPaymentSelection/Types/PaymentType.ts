export type PaymentMethod = "promptpay" | "card"

export type PaymentMethodData = {
  id: string
  is_enabled?: boolean
}

export type CardBrand = "mastercard" | "visa" | "jcb" | "unionpay"

export type PaymentFormData = {
  paymentMethod: PaymentMethod
  cardNumber: string
  cardName: string
  expiry: string
  cvv: string
  setAsDefault?: boolean
}

export type CustomerCard = {
  id: string
  brand: string | null
  last4: string | null
  exp_month: string | number | null
  exp_year: string | number | null
  is_default?: boolean
}

import {
  AffirmIcon,
  AlipayIcon,
  AmazonPayIcon,
  AmexIcon,
  ApplePayIcon,
  BancontactIcon,
  BitcoinIcon,
  BitcoinCashIcon,
  BitpayIcon,
  CitadeleIcon,
  DinersClubIcon,
  DiscoverIcon,
  EloIcon,
  EtheriumIcon,
  FacebookPayIcon,
  ForbrugsforeningenIcon,
  GiropayIcon,
  GooglePayIcon,
  IdealIcon,
  InteracIcon,
  JCBIcon,
  KlarnaIcon,
  LightcoinIcon,
  MaestroIcon,
  MastercardIcon,
  PayoneerIcon,
  PayPalIcon,
  PaysafeIcon,
  PoliIcon,
  QiwiIcon,
  SEPAIcon,
  ShopPayIcon,
  SkrillIcon,
  SofortIcon,
  StripeIcon,
  UnionPayIcon,
  VenmoIcon,
  VerifoneIcon,
  VisaIcon,
  WebmoneyIcon,
  WeChatIcon,
  YandexIcon,
  PaymentIconProps,
} from "@/icons/payment"
import { CreditCard } from "@medusajs/icons"
import type { ComponentType } from "react"

const brandToIcon = {
  affirm: AffirmIcon,
  alipay: AlipayIcon,
  amazonpay: AmazonPayIcon,
  amex: AmexIcon,
  applepay: ApplePayIcon,
  bancontact: BancontactIcon,
  bitcoin: BitcoinIcon,
  bitcoincash: BitcoinCashIcon,
  bitpay: BitpayIcon,
  citadele: CitadeleIcon,
  dinersclub: DinersClubIcon,
  discover: DiscoverIcon,
  elo: EloIcon,
  etherium: EtheriumIcon,
  facebookpay: FacebookPayIcon,
  forbrugsforeningen: ForbrugsforeningenIcon,
  giropay: GiropayIcon,
  googlepay: GooglePayIcon,
  ideal: IdealIcon,
  interac: InteracIcon,
  jcb: JCBIcon,
  klarna: KlarnaIcon,
  lightcoin: LightcoinIcon,
  maestro: MaestroIcon,
  mastercard: MastercardIcon,
  payoneer: PayoneerIcon,
  paypal: PayPalIcon,
  paysafe: PaysafeIcon,
  poli: PoliIcon,
  qiwi: QiwiIcon,
  sepa: SEPAIcon,
  shoppay: ShopPayIcon,
  skrill: SkrillIcon,
  sofort: SofortIcon,
  stripe: StripeIcon,
  unionpay: UnionPayIcon,
  venmo: VenmoIcon,
  verifone: VerifoneIcon,
  visa: VisaIcon,
  webmoney: WebmoneyIcon,
  wechat: WeChatIcon,
  yandex: YandexIcon,
} as const satisfies Record<string, ComponentType<PaymentIconProps>>

export type PaymentBrand = keyof typeof brandToIcon

export type PaymentProviderIconProps = {
  brand: PaymentBrand | string | null
  size?: number
  className?: string
}

const BRAND_VARIATIONS: Record<string, PaymentBrand> = {
  diners: "dinersclub",
  americanexpress: "amex",
} as const

function normalizeBrand(
  brand: PaymentBrand | string | null
): PaymentBrand | null {
  if (!brand) return null

  // If already a valid PaymentBrand, return it directly
  if (brand in brandToIcon) {
    return brand as PaymentBrand
  }

  // Otherwise, normalize the string
  const normalized = brand.toLowerCase().trim().replace(/\s+/g, "")

  // Check variations first, then direct match
  return (
    BRAND_VARIATIONS[normalized] ??
    (normalized in brandToIcon ? (normalized as PaymentBrand) : null)
  )
}

export function PaymentProviderIcon({
  brand,
  size = 24,
  className = "",
}: PaymentProviderIconProps) {
  const normalizedBrand = normalizeBrand(brand)
  const IconComponent = normalizedBrand ? brandToIcon[normalizedBrand] : null

  return IconComponent ? (
    <IconComponent size={size} className={className} />
  ) : (
    <CreditCard className={className} />
  )
}
